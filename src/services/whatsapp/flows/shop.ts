import Category from "../../../models/Category";
import Product from "../../../models/Product";
import Cart from "../../../models/Cart";
import { IWhatsAppSession } from "../../../models/WhatsAppSession";
import { NormalizedInput } from "../types";
import { sendButtons, sendImage, sendList, sendText } from "../api";
import { patchSessionData, updateSession } from "../session";
import { sendMainMenu } from "./main";

const PAGE_SIZE = 8;

export async function handleBrowseCategories(to: string, session: IWhatsAppSession): Promise<void> {
  const categories = await Category.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .limit(10)
    .lean();

  if (!categories.length) {
    await sendText(to, "No categories available right now. Please try again later.");
    return sendMainMenu(to, session);
  }

  await sendList(
    to,
    "Select a category to start shopping:",
    "View Categories",
    [
      {
        title: "Product Categories",
        rows: categories.map((c) => ({
          id: `cat_${c._id}`,
          title: c.name.substring(0, 24),
          description: c.description?.substring(0, 72) || `Browse ${c.name} products`,
        })),
      },
    ],
    "Shop by Category",
    'Type "menu" to go back',
  );

  await updateSession(session, "browse_cats", session.data);
}

export async function handleCategorySelected(
  to: string,
  session: IWhatsAppSession,
  categoryId: string,
): Promise<void> {
  const category = await Category.findById(categoryId).select("name").lean();
  const categoryName = category?.name || "Products";
  await updateSession(session, "browse_prods", {
    ...session.data,
    categoryId,
    categoryName,
    productPage: 0,
  });
  return showProductsPage(to, session, categoryId, categoryName, 0);
}

async function showProductsPage(
  to: string,
  session: IWhatsAppSession,
  categoryId: string,
  categoryName: string,
  page: number,
): Promise<void> {
  const skip = page * PAGE_SIZE;
  const [products, total] = await Promise.all([
    Product.find({ category: categoryId })
      .skip(skip)
      .limit(PAGE_SIZE)
      .select("_id id name discountPrice basePrice flavor variants images")
      .lean(),
    Product.countDocuments({ category: categoryId }),
  ]);

  if (!products.length && page === 0) {
    await sendText(to, `No products found in *${categoryName}*. Please try another category.`);
    return handleBrowseCategories(to, session);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const rows = products.map((p) => {
    const inStock = !p.variants?.length || p.variants.some((v: any) => v.stock > 0);
    const priceLabel = `₹${p.discountPrice}${p.flavor ? ` · ${p.flavor}` : ""}${!inStock ? " · Out of stock" : ""}`;
    return {
      id: `prod_${p._id}`,
      title: p.name.substring(0, 24),
      description: priceLabel.substring(0, 72),
    };
  });

  let footer = `${skip + 1}–${Math.min(skip + products.length, total)} of ${total}`;
  const nav: string[] = [];
  if (page > 0) nav.push('"prev"');
  if (page + 1 < totalPages) nav.push('"next"');
  if (nav.length) footer += ` · ${nav.join("/")} to navigate`;

  await sendList(
    to,
    "Tap a product to view details:",
    "View Products",
    [{ title: `${categoryName} (${total})`, rows }],
    categoryName,
    footer,
  );

  await updateSession(session, "browse_prods", {
    ...session.data,
    categoryId,
    categoryName,
    productPage: page,
  });
}

export async function handleBrowseProducts(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  const { categoryId, categoryName = "Products", productPage = 0 } = session.data;

  if (!categoryId) return handleBrowseCategories(to, session);

  const val = input.value;

  if (input.type === "text") {
    if (val === "next") return showProductsPage(to, session, categoryId, categoryName, productPage + 1);
    if (val === "prev" && productPage > 0)
      return showProductsPage(to, session, categoryId, categoryName, productPage - 1);
    if (val === "back") return handleBrowseCategories(to, session);
  }

  if (val.startsWith("prod_")) {
    const productId = val.replace("prod_", "");
    return showProductDetail(to, session, productId);
  }

  return showProductsPage(to, session, categoryId, categoryName, productPage);
}

async function showProductDetail(
  to: string,
  session: IWhatsAppSession,
  productId: string,
): Promise<void> {
  const product = await Product.findById(productId).lean();

  if (!product) {
    await sendText(to, "Product not found. Please try again.");
    return handleBrowseCategories(to, session);
  }

  await updateSession(session, "view_product", { ...session.data, productId });

  if (product.images?.[0]) {
    await sendImage(to, product.images[0], product.name).catch(() => {});
  }

  const hasMultiVariants = product.variants && product.variants.length > 1;
  const singleVariant = product.variants?.length === 1 ? product.variants[0] : null;
  const displayPrice = singleVariant?.price ?? product.discountPrice;
  const savingsPct =
    product.basePrice > displayPrice
      ? Math.round(((product.basePrice - displayPrice) / product.basePrice) * 100)
      : 0;

  let detail = `*${product.name}*\n`;
  if (product.flavor) detail += `_${product.flavor}_\n`;
  detail += `━━━━━━━━━━━━━━━\n`;
  detail += `💰 *Price:* ₹${displayPrice}`;
  if (savingsPct > 0) detail += ` _(${savingsPct}% off ₹${product.basePrice})_`;
  detail += "\n";
  if (product.rating > 0) detail += `⭐ ${product.rating}/5 (${product.reviewCount} reviews)\n`;
  detail += "\n";
  if (product.shortDescription) detail += `${product.shortDescription}\n`;

  if (hasMultiVariants) {
    detail += `\n*Available Variants:*\n`;
    product.variants.forEach((v: any, i: number) => {
      detail += `${i + 1}. ${v.label} – ₹${v.price} ${v.stock > 0 ? "✅" : "❌ Out of stock"}\n`;
    });
    detail += `\n_Reply with variant number to add to cart (e.g. *1*, *2*)_`;
    await sendText(to, detail);
  } else {
    const outOfStock = singleVariant && singleVariant.stock <= 0;
    if (outOfStock) detail += "\n❌ *Currently out of stock*";
    await sendText(to, detail);
    if (!outOfStock) {
      await sendButtons(
        to,
        "What would you like to do?",
        [
          { id: "add_to_cart", title: "Add to Cart" },
          { id: "view_cart", title: "View Cart" },
          { id: "btn_back", title: "Back" },
        ],
      );
    }
  }
}

export async function handleProductInteraction(
  to: string,
  session: IWhatsAppSession,
  input: NormalizedInput,
): Promise<void> {
  const { productId, categoryId, categoryName, productPage = 0 } = session.data;

  switch (input.value) {
    case "btn_back":
    case "back":
      return showProductsPage(to, session, categoryId, categoryName, productPage);
    case "view_cart": {
      const { handleCart } = await import("./cart");
      return handleCart(to, session);
    }
    case "add_to_cart":
      return addToCart(to, session, productId, undefined);
    case "menu_shop":
      return handleBrowseCategories(to, session);
    case "menu":
      return sendMainMenu(to, session);
  }

  // Variant number selection
  if (input.type === "text" && /^[1-9]\d*$/.test(input.value)) {
    return addToCart(to, session, productId, parseInt(input.value) - 1);
  }
}

async function addToCart(
  to: string,
  session: IWhatsAppSession,
  productId: string,
  variantIndex?: number,
): Promise<void> {
  if (!session.userId) {
    const { promptLogin } = await import("./login");
    return promptLogin(to, session, "your cart & checkout");
  }

  const product = await Product.findById(productId).lean();
  if (!product) {
    await sendText(to, "Product not found. Please try again.");
    return;
  }

  const hasVariants = product.variants && product.variants.length > 0;
  let variant: any = null;
  let unitPrice = product.discountPrice;

  if (hasVariants) {
    const idx = variantIndex !== undefined ? variantIndex : 0;
    variant = product.variants[idx];
    if (!variant) {
      await sendText(to, `Please reply with a number from 1 to ${product.variants.length} to select a variant.`);
      return;
    }
    if (variant.stock <= 0) {
      await sendText(to, `Sorry, *${variant.label}* is out of stock. Please choose another variant.`);
      return;
    }
    unitPrice = variant.price;
  }

  let cart = await Cart.findOne({ user: session.userId });
  if (!cart) {
    cart = new Cart({ user: session.userId, items: [], subtotal: 0 });
  }

  const existIdx = cart.items.findIndex(
    (item: any) => item.productId === product.id && item.variantId === (variant?.id ?? null),
  );

  if (existIdx >= 0) {
    (cart.items[existIdx] as any).quantity += 1;
    (cart.items[existIdx] as any).lineTotal =
      (cart.items[existIdx] as any).quantity * (cart.items[existIdx] as any).unitPrice;
  } else {
    (cart.items as any).push({
      product: product._id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0],
      flavor: product.flavor,
      variantId: variant?.id ?? undefined,
      variantLabel: variant?.label ?? undefined,
      unitPrice,
      quantity: 1,
      lineTotal: unitPrice,
    });
  }

  (cart as any).subtotal = (cart.items as any[]).reduce(
    (sum: number, item: any) => sum + item.lineTotal,
    0,
  );
  await cart.save();

  const variantInfo = variant?.label ? ` (${variant.label})` : "";
  await sendButtons(
    to,
    `✅ *${product.name}${variantInfo}* added to cart!\n\n${cart.items.length} item(s) · Total: ₹${(cart as any).subtotal}`,
    [
      { id: "view_cart", title: "View Cart" },
      { id: "menu_shop", title: "Shop More" },
      { id: "menu", title: "Main Menu" },
    ],
  );

  await patchSessionData(session, { productId });
}

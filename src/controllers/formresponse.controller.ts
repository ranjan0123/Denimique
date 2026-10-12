import { Request, Response } from "express";
import FormResponse, { FormResponseType } from "../models/FormResponse";
import { sendContactFormEmail } from "../utils/sendEmail";

const buildResponse = (payload: {
  type: FormResponseType;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  city?: string;
  message?: string;
  monthlyRequirement?: string;
  sourceUrl?: string;
}) => ({
  type: payload.type,
  name: payload.name || "",
  email: payload.email || "",
  phone: payload.phone || "",
  company: payload.company || "",
  city: payload.city || "",
  message: payload.message || "",
  monthlyRequirement: payload.monthlyRequirement || "",
  sourceUrl: payload.sourceUrl || "",
});

// Public submissions

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, message, sourceUrl } = req.body;

    if (!email || !message) {
      return res.status(400).json({ message: "Email and message are required" });
    }

    const name = [firstName, lastName].filter(Boolean).join(" ").trim();
    const submission = await FormResponse.create(
      buildResponse({
        type: "contact",
        name,
        email,
        message,
        sourceUrl,
      }),
    );

    // Best-effort notification — a failed email should never block the
    // submission itself, since it's already safely stored above.
    try {
      await sendContactFormEmail({ name, email, message, sourceUrl });
    } catch (emailError) {
      console.error("Failed to send contact form notification email:", emailError);
    }

    res.status(201).json({ message: "Message received", data: submission });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const submitNewsletterForm = async (req: Request, res: Response) => {
  try {
    const { email, sourceUrl } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const submission = await FormResponse.create(
      buildResponse({ type: "newsletter", email, sourceUrl }),
    );

    res.status(201).json({ message: "Subscribed successfully", data: submission });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const submitBlogSubscribeForm = async (req: Request, res: Response) => {
  try {
    const { email, sourceUrl } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const submission = await FormResponse.create(
      buildResponse({ type: "blog-subscribe", email, sourceUrl }),
    );

    res.status(201).json({ message: "Subscribed successfully", data: submission });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const submitWholesaleForm = async (req: Request, res: Response) => {
  try {
    const {
      name,
      businessName,
      phone,
      email,
      city,
      monthlyRequirement,
      message,
      sourceUrl,
    } = req.body;

    if (!name || !businessName || !phone || !email || !city || !message) {
      return res.status(400).json({ message: "All required fields are missing" });
    }

    const submission = await FormResponse.create(
      buildResponse({
        type: "wholesale",
        name,
        email,
        phone,
        company: businessName,
        city,
        monthlyRequirement,
        message,
        sourceUrl,
      }),
    );

    res.status(201).json({ message: "Enquiry received", data: submission });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin
export const getFormResponses = async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const responses = await FormResponse.find(filter).sort({ createdAt: -1 });
    res.json({ data: responses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getFormResponseById = async (req: Request, res: Response) => {
  try {
    const response = await FormResponse.findById(req.params.id);
    if (!response) {
      return res.status(404).json({ message: "Response not found" });
    }
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateFormResponseStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!["new", "read", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await FormResponse.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Response not found" });
    }

    res.json({ message: "Status updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteFormResponse = async (req: Request, res: Response) => {
  try {
    const deleted = await FormResponse.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Response not found" });
    }
    res.json({ message: "Response deleted", data: deleted });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

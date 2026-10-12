import { Response } from "express";
import Notification from "../models/Notification";
import { AuthRequest } from "../middleware/auth.middleware";

const serializeNotification = (notification: any) => {
  const metadata = notification.metadata || {};
  const order = notification.order;

  return {
    ...notification,
    statusSnapshot:
      metadata.currentOrderStatus ||
      metadata.orderStatus ||
      order?.orderStatus ||
      null,
    paymentSnapshot:
      metadata.currentPaymentStatus ||
      metadata.paymentStatus ||
      order?.paymentStatus ||
      null,
    previousOrderStatus: metadata.previousOrderStatus || null,
    previousPaymentStatus: metadata.previousPaymentStatus || null,
  };
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate("order", "orderNumber orderStatus paymentStatus total")
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications.map((notification) => serializeNotification(notification)));
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getUnreadNotificationCount = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate("order", "orderNumber orderStatus paymentStatus total")
      .lean();

    res.json(serializeNotification(populatedNotification));
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const markAllNotificationsAsRead = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    await Notification.updateMany(
      {
        user: req.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

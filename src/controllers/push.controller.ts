import { Request, Response } from "express";
import PushSubscription from "../models/PushSubscription";
import { broadcastPush } from "../utils/push";

export const subscribe = async (req: Request, res: Response) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = (req as any).user.id;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: userId, endpoint, keys },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({ message: "Subscribed" });
  } catch (error) {
    console.error("Push subscribe error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint is required" });
    }

    await PushSubscription.deleteOne({
      endpoint,
      user: (req as any).user.id,
    });

    res.json({ message: "Unsubscribed" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const broadcast = async (req: Request, res: Response) => {
  try {
    const { title, message, url } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res
        .status(400)
        .json({ message: "Title and message are required" });
    }

    const result = await broadcastPush({
      title: title.trim(),
      message: message.trim(),
      url: url?.trim() || undefined,
    });

    res.json(result);
  } catch (error) {
    console.error("Push broadcast error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

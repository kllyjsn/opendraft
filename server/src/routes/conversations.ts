import { Router, Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { Conversation, Message, Profile } from "../models/index.js";

const router = Router();

// GET /api/conversations — List user's conversations
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversations = await Conversation.find({
      $or: [{ buyer_id: req.userId }, { seller_id: req.userId }],
    }).sort({ updated_at: -1 });

    // Enrich with other party's profile and last message
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherId = conv.buyer_id === req.userId ? conv.seller_id : conv.buyer_id;
        const profile = await Profile.findOne({ user_id: otherId });
        const lastMessage = await Message.findOne({ conversation_id: conv._id.toString() })
          .sort({ created_at: -1 });
        const unreadCount = await Message.countDocuments({
          conversation_id: conv._id.toString(),
          read: false,
          sender_id: { $ne: req.userId },
        });
        return { ...conv.toObject(), otherProfile: profile, lastMessage, unreadCount };
      })
    );

    res.json({ data: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// GET /api/conversations/:id/messages — Get messages for a conversation
router.get("/:id/messages", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || (conv.buyer_id !== req.userId && conv.seller_id !== req.userId)) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await Message.find({ conversation_id: req.params.id })
      .sort({ created_at: 1 });

    // Mark messages as read
    await Message.updateMany(
      { conversation_id: req.params.id, sender_id: { $ne: req.userId }, read: false },
      { read: true }
    );

    res.json({ data: messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/conversations/:id/messages — Send a message
router.post("/:id/messages", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || (conv.buyer_id !== req.userId && conv.seller_id !== req.userId)) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const message = await Message.create({
      conversation_id: req.params.id,
      sender_id: req.userId,
      content: req.body.content,
    });

    // Update conversation timestamp
    await Conversation.findByIdAndUpdate(req.params.id, { updated_at: new Date() });

    res.status(201).json({ data: message });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// POST /api/conversations — Create or find existing conversation
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { seller_id, listing_id } = req.body;

    // Check if conversation already exists
    let conv = await Conversation.findOne({
      buyer_id: req.userId,
      seller_id,
      ...(listing_id ? { listing_id } : {}),
    });

    if (!conv) {
      conv = await Conversation.create({
        buyer_id: req.userId,
        seller_id,
        listing_id: listing_id || null,
      });
    }

    res.json({ data: conv });
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /api/conversations/unread-count — Get total unread message count
router.get("/unread-count", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversations = await Conversation.find({
      $or: [{ buyer_id: req.userId }, { seller_id: req.userId }],
    });
    const conversationIds = conversations.map((c) => c._id.toString());

    if (conversationIds.length === 0) {
      res.json({ count: 0 });
      return;
    }

    const count = await Message.countDocuments({
      conversation_id: { $in: conversationIds },
      read: false,
      sender_id: { $ne: req.userId },
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

export default router;

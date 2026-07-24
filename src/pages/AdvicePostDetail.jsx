import React, { useState, useEffect } from "react";
import { useParams, useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ThumbsUp, Flag, Send, Trash2 } from "lucide-react";
import { checkContent } from "@/lib/moderation";
import { canDo } from "@/lib/rateLimit";

export default function AdvicePostDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [p, r] = await Promise.all([
        base44.entities.AdvicePost.get(id),
        base44.entities.AdviceReply.filter({ post_id: id, status: "active" }, "created_date"),
      ]);
      setPost(p);
      setReplies(r);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    const check = checkContent(replyText);
    if (check.blocked) { toast({ title: "Reply blocked", description: check.reason, variant: "destructive" }); return; }
    const rl = canDo("reply");
    if (!rl.ok) { toast({ title: "Please wait a moment", description: `Try again in ${rl.wait}s.`, variant: "destructive" }); return; }
    setSending(true);
    const reply = await base44.entities.AdviceReply.create({ user_id: user.id, post_id: id, body: replyText });
    await base44.entities.AdvicePost.update(id, { reply_count: (post.reply_count || 0) + 1 });
    setReplies([...replies, reply]);
    setPost(p => ({ ...p, reply_count: (p.reply_count || 0) + 1 }));
    setReplyText("");
    setSending(false);
    toast({ title: "Reply posted anonymously" });
  };

  const handleDeletePost = async () => {
    await base44.entities.AdvicePost.delete(id);
    toast({ title: "Post deleted" });
    window.location.href = "/advice-corner";
  };

  const handleDeleteReply = async (replyId) => {
    await base44.entities.AdviceReply.delete(replyId);
    setReplies(replies.filter(r => r.id !== replyId));
    await base44.entities.AdvicePost.update(id, { reply_count: Math.max((post.reply_count || 0) - 1, 0) });
    setPost(p => ({ ...p, reply_count: Math.max((p.reply_count || 0) - 1, 0) }));
    toast({ title: "Reply deleted" });
  };

  const handleFlag = async () => {
    await base44.entities.SentMessage.create({
      user_id: user.id,
      message_type: "flag_post",
      subject: `Flagged post: ${post.title}`,
      body: `This post was flagged for admin review.\n\nPost content: ${post.body}`,
      related_id: id,
    });
    await base44.entities.AdvicePost.update(id, { flagged: true });
    setPost(p => ({ ...p, flagged: true }));
    toast({ title: "Reported to admins", description: "Thank you — our team will review this post." });
  };

  const handleFlagReply = async (reply) => {
    await base44.entities.SentMessage.create({
      user_id: user.id,
      message_type: "flag_reply",
      subject: "Flagged reply in Advice Corner",
      body: `This reply was flagged for admin review.\n\nReply content: ${reply.body}`,
      related_id: reply.id,
    });
    await base44.entities.AdviceReply.update(reply.id, { flagged: true });
    setReplies(rs => rs.map(r => r.id === reply.id ? { ...r, flagged: true } : r));
    toast({ title: "Reported to admins", description: "Thank you — our team will review this reply." });
  };

  const handleUpvote = async () => {
    const updated = await base44.entities.AdvicePost.update(post.id, { upvotes: (post.upvotes || 0) + 1 });
    setPost(updated);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;
  }

  if (!post) {
    return <div className="text-center py-20"><p className="text-muted-foreground">Post not found.</p></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/advice-corner">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </Link>

      <div className="bg-card rounded-2xl p-6 border border-border/50 mb-4">
        <span className="inline-block px-2 py-0.5 rounded-md bg-sage/10 text-sage text-xs font-medium mb-3">{post.topic}</span>
        <h1 className="font-heading text-xl font-bold text-foreground mb-2">{post.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{post.body}</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
          <button onClick={handleUpvote} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-navy transition-colors">
            <ThumbsUp className="w-4 h-4" /> {post.upvotes || 0}
          </button>
          <button onClick={handleFlag} disabled={post.flagged} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <Flag className="w-4 h-4" /> {post.flagged ? "Reported" : "Report"}
          </button>
          {post.user_id === user.id && (
            <Button variant="ghost" size="sm" onClick={handleDeletePost} className="text-muted-foreground hover:text-destructive ml-auto -mr-2">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">Anonymous · {new Date(post.created_date).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Replies */}
      <h3 className="font-heading text-base font-semibold mb-3">Replies ({replies.length})</h3>
      <div className="space-y-2 mb-6">
        {replies.map(r => (
          <div key={r.id} className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-foreground leading-relaxed">{r.body}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Anonymous · {new Date(r.created_date).toLocaleDateString()}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => handleFlagReply(r)} disabled={r.flagged} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                  <Flag className="w-3 h-3" /> {r.flagged ? "Reported" : "Report"}
                </button>
                {r.user_id === user.id && (
                  <button onClick={() => handleDeleteReply(r.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
 

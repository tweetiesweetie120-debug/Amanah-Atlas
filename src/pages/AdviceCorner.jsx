import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Heart, ThumbsUp, MessageCircle, Flag, Shield, Trash2 } from "lucide-react";
import { checkContent } from "@/lib/moderation";
import { canDo } from "@/lib/rateLimit";

const TOPICS = ["School stress", "Friendships", "Identity", "Balancing deen", "Prayer at school", "Family expectations", "Bullying", "Peer pressure", "College stress", "Motivation"];

export default function AdviceCorner() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topicFilter, setTopicFilter] = useState("all");
  const [form, setForm] = useState({ topic: "", title: "", body: "" });

  useEffect(() => {
    base44.entities.AdvicePost.filter({ status: "active" }, "-created_date").then(p => { setPosts(p); setLoading(false); });
  }, []);

  const handlePost = async () => {
    if (!form.topic || !form.title || !form.body) return;
    const check = checkContent(`${form.title} ${form.body}`);
    if (check.blocked) { toast({ title: "Message blocked", description: check.reason, variant: "destructive" }); return; }
    const rl = canDo("post");
    if (!rl.ok) { toast({ title: "Please wait a moment", description: `Try again in ${rl.wait}s.`, variant: "destructive" }); return; }
    setSaving(true);
    const post = await base44.entities.AdvicePost.create({ ...form, user_id: user.id });
    setPosts([post, ...posts]);
    setForm({ topic: "", title: "", body: "" });
    setOpen(false);
    setSaving(false);
    toast({ title: "Posted anonymously!", description: "Your post is now visible to the community." });
  };

  const handleDelete = async (postId) => {
    await base44.entities.AdvicePost.delete(postId);
    setPosts(posts.filter(p => p.id !== postId));
    toast({ title: "Post deleted" });
  };

  const handleUpvote = async (post) => {
    const updated = await base44.entities.AdvicePost.update(post.id, { upvotes: (post.upvotes || 0) + 1 });
    setPosts(ps => ps.map(p => p.id === post.id ? updated : p));
  };

  const filtered = topicFilter === "all" ? posts : posts.filter(p => p.topic === topicFilter);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      {/* Kindness banner */}
      <div className="bg-sage/10 rounded-2xl p-4 flex items-start gap-3 mb-6 border border-sage/20">
        <Shield className="w-5 h-5 text-navy shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">This is a safe, anonymous space</p>
          <p className="text-xs text-muted-foreground mt-0.5">Be kind. No personal info, no usernames, no contact details. All posts are anonymous.</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Advice Corner</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle className="font-heading">Share Anonymously</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-sm mb-1 block">Topic *</Label>
                <Select value={form.topic} onValueChange={v => setForm(f => ({ ...f, topic: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a topic" /></SelectTrigger>
                  <SelectContent>{TOPICS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1 block">Title *</Label>
                <Input className="rounded-xl" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What's on your mind?" />
              </div>
              <div>
                <Label className="text-sm mb-1 block">Your thoughts *</Label>
                <Textarea className="rounded-xl" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Share your experience or ask for advice..." />
              </div>
              <Button onClick={handlePost} disabled={saving} className="w-full bg-navy hover:bg-navy/90 text-white rounded-xl">
                {saving ? "Posting..." : "Post Anonymously"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Topic filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button onClick={() => setTopicFilter("all")} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${topicFilter === "all" ? "bg-navy text-white" : "bg-muted text-muted-foreground"}`}>
          All Topics
        </button>
        {TOPICS.map(t => (
          <button key={t} onClick={() => setTopicFilter(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${topicFilter === t ? "bg-navy text-white" : "bg-muted text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Heart} title="No posts yet" description="Be the first to share — all posts are completely anonymous." />
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <Link key={post.id} to={`/advice-corner/${post.id}`}>
              <div className="bg-card rounded-2xl p-5 border border-border/50 hover:shadow-md transition-all cursor-pointer">
                <span className="inline-block px-2 py-0.5 rounded-md bg-sage/10 text-sage text-xs font-medium mb-2">{post.topic}</span>
                <h3 className="font-medium text-sm text-foreground mb-1">{post.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.body}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <button onClick={e => { e.preventDefault(); handleUpvote(post); }} className="flex items-center gap-1 hover:text-navy transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" /> {post.upvotes || 0}
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> {post.reply_count || 0}
                  </span>
                  {post.user_id === user.id && (
                    <button onClick={e => { e.preventDefault(); handleDelete(post.id); }} className="flex items-center gap-1 hover:text-destructive transition-colors ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

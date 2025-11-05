"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { MessageSquare, Send, Edit2, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CommentSectionProps {
  entityType: "DEAL" | "CONTACT" | "ACTIVITY";
  entityId: string;
  currentUserId?: string;
}

export default function CommentSection({
  entityType,
  entityId,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/comments?type=${entityType}&id=${entityId}`
      );
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      alert("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.post("/comments", {
        content: newComment,
        commentableType: entityType,
        commentableId: entityId,
      });
      setComments([response.data, ...comments]);
      setNewComment("");
      alert("Comment added successfully!");
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await api.patch(`/comments/${id}`, {
        content: editContent,
      });
      setComments(
        comments.map((comment) =>
          comment.id === id ? response.data : comment
        )
      );
      setEditingId(null);
      setEditContent("");
      alert("Comment updated successfully!");
    } catch (error) {
      console.error("Failed to update comment:", error);
      alert("Failed to update comment");
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter((comment) => comment.id !== id));
      alert("Comment deleted successfully!");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment");
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="mb-6">
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Comments List */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {comment.user.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                      {comment.updatedAt !== comment.createdAt && " (edited)"}
                    </p>
                  </div>
                  {currentUserId === comment.user.id && (
                    <div className="flex gap-2">
                      {editingId !== comment.id && (
                        <>
                          <button
                            onClick={() => startEdit(comment)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit comment"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                {editingId === comment.id ? (
                  <div className="mt-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="mt-2 flex gap-2 justify-end">
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

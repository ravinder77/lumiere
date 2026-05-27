import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { fetchReviews, submitReview, deleteReview, Review } from '../lib/extraApi';
import { useAuthStore } from '../store/authStore';
import StarRating from './StarRating';
import { ReviewSkeleton } from './Skeletons';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ReviewsSectionProps {
  productId: string;
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { user, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => fetchReviews(productId),
  });

  const reviews  = data?.data?.reviews ?? [];
  const stats    = data?.data?.stats;
  const myReview = reviews.find((r) => r.userId === user?.id);

  const [showForm, setShowForm] = useState(false);
  const [rating,   setRating]   = useState(myReview?.rating ?? 5);
  const [title,    setTitle]    = useState(myReview?.title  ?? '');
  const [body,     setBody]     = useState(myReview?.body   ?? '');
  const [formError, setFormError] = useState('');

  const submitMutation = useMutation({
    mutationFn: () => submitReview(productId, { rating, title, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      setShowForm(false);
      toast.success(myReview ? 'Review updated!' : 'Review submitted!');
    },
    onError: (err: Error) => setFormError(err.message ?? 'Failed to submit review'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteReview(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      setTitle(''); setBody(''); setRating(5);
      toast.success('Review deleted');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim() || !body.trim()) { setFormError('Please fill in all fields'); return; }
    submitMutation.mutate();
  };

  return (
    <section className="mt-16 pt-10 border-t border-stone-200">
      <h2 className="font-display text-2xl font-medium text-stone-900 mb-8">
        Customer Reviews
      </h2>

      {/* Stats row */}
      {stats && stats.count > 0 && (
        <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-stone-50 border border-stone-200">
          {/* Average */}
          <div className="text-center sm:border-r border-stone-200 sm:pr-8">
            <p className="text-5xl font-display font-medium text-stone-900">{stats.average.toFixed(1)}</p>
            <StarRating value={stats.average} size={16} className="justify-center mt-2" />
            <p className="text-xs text-stone-400 mt-1">{stats.count} review{stats.count !== 1 ? 's' : ''}</p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5">
            {stats.distribution.map(({ star, count }) => {
              const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="w-3 text-right">{star}</span>
                  <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write / edit review */}
      {isAuthenticated && (
        <div className="mb-8">
          {!showForm ? (
            <button
              onClick={() => { setTitle(myReview?.title ?? ''); setBody(myReview?.body ?? ''); setRating(myReview?.rating ?? 5); setShowForm(true); }}
              className="btn-secondary"
            >
              <Edit2 size={14} />
              {myReview ? 'Edit Your Review' : 'Write a Review'}
            </button>
          ) : (
            <div className="border border-stone-200 p-6 animate-fade-in">
              <h3 className="font-medium text-stone-900 mb-4">
                {myReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-stone-500 mb-2">Rating</label>
                  <StarRating value={rating} size={24} interactive onChange={setRating} />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarise your experience"
                    maxLength={120}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">Review</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    placeholder="Share your thoughts about this product…"
                    maxLength={2000}
                    className="input resize-none"
                  />
                  <p className="text-xs text-stone-400 mt-1 text-right">{body.length}/2000</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="btn-primary disabled:opacity-60"
                  >
                    {submitMutation.isPending ? 'Submitting…' : 'Submit Review'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setFormError(''); }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-6">{[1,2,3].map((i) => <ReviewSkeleton key={i} />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm mt-1">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review: Review) => (
            <div key={review.id} className="border-b border-stone-100 pb-6 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-800">{review.user.name}</span>
                      {review.verified && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={11} /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating value={review.rating} size={12} />
                      <span className="text-xs text-stone-400">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Delete button for own review or admin */}
                {(review.userId === user?.id || user?.role === 'ADMIN') && (
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="text-stone-300 hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label="Delete review"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="mt-3 ml-11">
                <p className="text-sm font-medium text-stone-800 mb-1">{review.title}</p>
                <p className="text-sm text-stone-600 leading-relaxed">{review.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Play, Users, Clapperboard, Star, ThumbsDown, ThumbsUp, MessageSquare, Send } from 'lucide-react';
import { posterUrl } from '@/lib/posterUrl';
import { getSafeUser, supabase } from '@/lib/supabaseClient';
import type { Movie } from '@/lib/types';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface MovieDetails extends Movie {
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  cast?: CastMember[];
  providers?: StreamingProvider[];
  trailer_key?: string | null;
}

interface MovieComment {
  id: string;
  tmdb_id: number;
  user_id: string;
  user_name: string;
  content: string;
  parent_id: string | null;
  likes: number;
  dislikes: number;
  created_at: string;
  replies: MovieComment[];
}

export default function MovieDetailModal({
  movie,
  onClose,
}: {
  movie: Movie;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<MovieDetails>(movie);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [comments, setComments] = useState<MovieComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [commentError, setCommentError] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [myReactions, setMyReactions] = useState<Record<string, 'like' | 'dislike'>>({});

  useEffect(() => {
    // TMDB Details (Cast, Streaming & Trailer) nachladen
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/tmdb/movie/${movie.tmdb_id}`);
        const data = await res.json();
        if (data.movie) {
          setDetails({
            ...movie,
            ...data.movie,
            cast: data.movie.cast || [],
            providers: data.movie.providers || [],
            trailer_key: data.movie.trailer_key || null,
          });
        }
      } catch (err) {
        console.error('Fehler beim Laden der Filmdetails:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [movie]);

  useEffect(() => {
    async function fetchComments() {
      setCommentsLoading(true);
      setCommentError('');

      const { data, error } = await supabase
        .from('movie_comments')
        .select('*')
        .eq('tmdb_id', movie.tmdb_id)
        .order('created_at', { ascending: true });

      if (error) {
        setCommentError(`Kommentare konnten nicht geladen werden: ${error.message}`);
      } else {
        const allComments = (data ?? []) as Omit<MovieComment, 'replies'>[];
        const repliesByParent = new Map<string, MovieComment[]>();

        allComments.forEach((comment) => {
          if (comment.parent_id) {
            const replies = repliesByParent.get(comment.parent_id) ?? [];
            replies.push({ ...comment, replies: [] });
            repliesByParent.set(comment.parent_id, replies);
          }
        });

        setComments(
          allComments
            .filter((comment) => !comment.parent_id)
            .map((comment) => ({
              ...comment,
              replies: repliesByParent.get(comment.id) ?? [],
            }))
        );

        const user = await getSafeUser();
        if (user && allComments.length > 0) {
          const { data: reactionRows, error: reactionError } = await supabase
            .from('comment_reactions')
            .select('comment_id,reaction')
            .eq('user_id', user.id)
            .in('comment_id', allComments.map((comment) => comment.id));
          if (!reactionError) {
            setMyReactions(Object.fromEntries(
              (reactionRows ?? []).map((row) => [row.comment_id, row.reaction as 'like' | 'dislike'])
            ));
          }
        }
      }

      setCommentsLoading(false);
    }

    fetchComments();
  }, [movie.tmdb_id]);

  async function submitComment(parentId: string | null = null) {
    const content = (parentId ? replyText : commentText).trim();
    if (!content || submittingComment) return;

    setSubmittingComment(true);
    setCommentError('');
    const user = await getSafeUser();

    if (!user) {
      setCommentError('Bitte melde dich an, um zu kommentieren.');
      setSubmittingComment(false);
      return;
    }

    const { data, error } = await supabase
      .from('movie_comments')
      .insert({
        tmdb_id: movie.tmdb_id,
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Filmfan',
        content,
        parent_id: parentId,
      })
      .select()
      .single();

    if (error) {
      setCommentError(`Kommentar konnte nicht gespeichert werden: ${error.message}`);
    } else if (data) {
      const newComment = { ...(data as Omit<MovieComment, 'replies'>), replies: [] };
      if (parentId) {
        setComments((current) => current.map((comment) => (
          comment.id === parentId
            ? { ...comment, replies: [...comment.replies, newComment] }
            : comment
        )));
        setReplyText('');
        setReplyTo(null);
      } else {
        setComments((current) => [...current, newComment]);
        setCommentText('');
      }
    }

    setSubmittingComment(false);
  }

  async function reactToComment(commentId: string, reaction: 'like' | 'dislike') {
    const user = await getSafeUser();
    if (!user) {
      setCommentError('Bitte melde dich an, um zu reagieren.');
      return;
    }

    const { data, error } = await supabase.rpc('toggle_comment_reaction', {
      p_comment_id: commentId,
      p_reaction: reaction,
    });

    if (error || !data) {
      setCommentError(`Reaktion konnte nicht gespeichert werden: ${error?.message ?? 'Keine Antwort von Supabase'}`);
      return;
    }

    const result = (Array.isArray(data) ? data[0] : data) as {
      reaction: 'like' | 'dislike' | null;
      likes: number;
      dislikes: number;
    };
    if (!result) {
      setCommentError('Reaktion konnte nicht gespeichert werden: Ungültige RPC-Antwort');
      return;
    }
    setMyReactions((current) => {
      const next = { ...current };
      if (result.reaction) next[commentId] = result.reaction;
      else delete next[commentId];
      return next;
    });
    setComments((current) => current.map((item) => {
      if (item.id === commentId) return { ...item, likes: result.likes, dislikes: result.dislikes };
      return {
        ...item,
        replies: item.replies.map((reply) => (
          reply.id === commentId ? { ...reply, likes: result.likes, dislikes: result.dislikes } : reply
        )),
      };
    }));
  }

  const poster = posterUrl(details.poster_path, 'w500');
  const releaseDate = details.release_date ? new Date(`${details.release_date}T00:00:00`) : null;
  const isUpcoming = releaseDate ? releaseDate.getTime() > Date.now() : false;
  const formattedReleaseDate = releaseDate
    ? new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(releaseDate)
    : null;
  const ticketSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${details.title} Kino Tickets kaufen`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Schließen-Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-cinema-surface2 text-cinema-muted hover:bg-cinema-accent hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* YouTube Trailer Player (wenn aktiv) */}
        {showTrailer && details.trailer_key ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-cinema-border shadow-lg mb-6">
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${details.trailer_key}?autoplay=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Poster */}
            <div className="relative aspect-[2/3] w-full sm:w-44 flex-shrink-0 rounded-xl overflow-hidden bg-cinema-surface2 shadow-md">
              {poster ? (
                <Image src={poster} alt={details.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                  <Clapperboard size={36} />
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex flex-col flex-1 gap-3">
              <div>
                <h3 className="text-2xl font-bold">{details.title}</h3>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-cinema-muted">
                  <span>{details.release_year ?? '—'}</span>
                  {details.vote_average !== undefined && (
                    <span className="inline-flex items-center gap-1 text-amber-300" title={`${details.vote_count ?? 0} Bewertungen`}>
                      <Star size={14} fill="currentColor" /> {details.vote_average.toFixed(1)}
                    </span>
                  )}
                  {details.director && <span>· Regie: {details.director}</span>}
                </p>
              </div>

              {/* Trailer Button */}
              {details.trailer_key && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-500 w-fit"
                >
                  <Play size={14} fill="white" /> Trailer abspielen
                </button>
              )}

              {/* Genres */}
              {details.genres && details.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {details.genres.map((g) => (
                    <span key={g} className="rounded-full border border-cinema-border bg-cinema-surface2 px-2.5 py-0.5 text-[10px] text-cinema-muted">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs leading-relaxed text-cinema-muted">
                {details.overview || 'Keine Beschreibung verfügbar.'}
              </p>
            </div>
          </div>
        )}

        {/* Streaming Anbieter */}
        <div className="mt-6 border-t border-cinema-border pt-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-cinema-accent mb-3">
            <Play size={15} /> Wo streamen?
          </h4>
          {loading ? (
            <p className="text-xs text-cinema-muted">Lade Streaming-Anbieter...</p>
          ) : details.providers && details.providers.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {details.providers.map((p) => (
                <div key={p.provider_id} className="flex items-center gap-2 rounded-lg bg-cinema-surface2 px-3 py-1.5 border border-cinema-border">
                  {p.logo_path && (
                    <img
                      src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                      alt={p.provider_name}
                      className="h-5 w-5 rounded-md object-cover"
                    />
                  )}
                  <span className="text-xs font-medium">{p.provider_name}</span>
                </div>
              ))}
            </div>
          ) : isUpcoming && formattedReleaseDate ? (
            <div className="rounded-xl border border-cinema-accent/40 bg-cinema-surface2 p-4">
              <p className="text-sm font-semibold text-white">Demnächst im Kino</p>
              <p className="mt-1 text-xs text-cinema-muted">Kinostart am {formattedReleaseDate}</p>
              <a
                href={ticketSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center rounded-lg bg-cinema-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cinema-accent/80"
              >
                🎟️ Kino &amp; Tickets suchen
              </a>
            </div>
          ) : (
            <p className="text-xs text-cinema-muted">Aktuell bei keinem Flatrate-Anbieter in DE verfügbar.</p>
          )}
        </div>

        {/* Schauspieler (Cast) */}
        <div className="mt-6 border-t border-cinema-border pt-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-cinema-accent mb-3">
            <Users size={15} /> Top-Besetzung
          </h4>
          {loading ? (
            <p className="text-xs text-cinema-muted">Lade Schauspieler...</p>
          ) : details.cast && details.cast.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {details.cast.slice(0, 5).map((actor) => (
                <div key={actor.id} className="flex flex-col items-center text-center rounded-xl bg-cinema-surface2 p-2 border border-cinema-border">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden mb-1.5 bg-black/40">
                    {actor.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-cinema-muted">Kein Bild</div>
                    )}
                  </div>
                  <span className="text-xs font-semibold line-clamp-1">{actor.name}</span>
                  <span className="text-[10px] text-cinema-muted line-clamp-1">{actor.character}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-cinema-muted">Keine Cast-Informationen verfügbar.</p>
          )}
        </div>

        {/* Community-Diskussion */}
        <div className="mt-6 border-t border-cinema-border pt-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-cinema-accent mb-3">
            <MessageSquare size={15} /> 💬 Community-Diskussion
          </h4>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitComment();
            }}
            className="flex gap-2"
          >
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Schreib etwas zum Film..."
              maxLength={1000}
              className="min-w-0 flex-1 rounded-lg border border-cinema-border bg-cinema-surface2 px-3 py-2 text-xs text-white outline-none placeholder:text-cinema-muted focus:border-cinema-accent"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              aria-label="Kommentar senden"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-cinema-accent text-white transition-colors hover:bg-cinema-accent/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>

          {commentError && <p className="mt-2 text-xs text-red-300">{commentError}</p>}

          {commentsLoading ? (
            <p className="mt-4 text-xs text-cinema-muted">Lade Community-Diskussion...</p>
          ) : comments.length === 0 ? (
            <p className="mt-4 text-xs text-cinema-muted">Noch keine Kommentare. Sei der Erste!</p>
          ) : (
            <div className="mt-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="rounded-xl border border-cinema-border bg-cinema-surface2 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/profile/${comment.user_id}`} className="text-xs font-semibold text-white hover:text-cinema-accent">{comment.user_name}</Link>
                      <time className="text-[10px] text-cinema-muted" dateTime={comment.created_at}>
                        {new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(comment.created_at))}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-cinema-muted">{comment.content}</p>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-cinema-muted">
                      <button type="button" onClick={() => reactToComment(comment.id, 'like')} className={`inline-flex items-center gap-1 ${myReactions[comment.id] === 'like' ? 'text-emerald-300' : 'hover:text-emerald-300'}`}>
                        <ThumbsUp size={13} /> {comment.likes}
                      </button>
                      <button type="button" onClick={() => reactToComment(comment.id, 'dislike')} className={`inline-flex items-center gap-1 ${myReactions[comment.id] === 'dislike' ? 'text-red-300' : 'hover:text-red-300'}`}>
                        <ThumbsDown size={13} /> {comment.dislikes}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        className="inline-flex items-center gap-1 hover:text-white"
                      >
                        <MessageSquare size={13} /> Antworten
                      </button>
                    </div>
                    {replyTo === comment.id && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          submitComment(comment.id);
                        }}
                        className="mt-3 flex gap-2"
                      >
                        <input
                          value={replyText}
                          onChange={(event) => setReplyText(event.target.value)}
                          placeholder="Deine Antwort..."
                          maxLength={1000}
                          autoFocus
                          className="min-w-0 flex-1 rounded-lg border border-cinema-border bg-cinema-surface px-3 py-2 text-xs text-white outline-none placeholder:text-cinema-muted focus:border-cinema-accent"
                        />
                        <button
                          type="submit"
                          disabled={submittingComment || !replyText.trim()}
                          aria-label="Antwort senden"
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-cinema-accent text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    )}
                  </div>

                  {comment.replies.length > 0 && (
                    <div className="ml-4 space-y-2 border-l border-cinema-border pl-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="rounded-xl border border-cinema-border/70 bg-cinema-surface2/60 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <Link href={`/profile/${reply.user_id}`} className="text-xs font-semibold text-white hover:text-cinema-accent">{reply.user_name}</Link>
                            <time className="text-[10px] text-cinema-muted" dateTime={reply.created_at}>
                              {new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(reply.created_at))}
                            </time>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-cinema-muted">{reply.content}</p>
                          <div className="mt-3 flex items-center gap-3 text-[11px] text-cinema-muted">
                            <button type="button" onClick={() => reactToComment(reply.id, 'like')} className={`inline-flex items-center gap-1 ${myReactions[reply.id] === 'like' ? 'text-emerald-300' : 'hover:text-emerald-300'}`}>
                              <ThumbsUp size={13} /> {reply.likes}
                            </button>
                            <button type="button" onClick={() => reactToComment(reply.id, 'dislike')} className={`inline-flex items-center gap-1 ${myReactions[reply.id] === 'dislike' ? 'text-red-300' : 'hover:text-red-300'}`}>
                              <ThumbsDown size={13} /> {reply.dislikes}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
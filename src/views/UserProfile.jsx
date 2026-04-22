import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Heart, MessageSquare, MapPin, ArrowLeft, Star, Smile, Meh, Frown, Trash2, Camera, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';

// =============================================================================
// Constants
// =============================================================================

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
    }
};

const stagger = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

// =============================================================================
// Helper Functions
// =============================================================================

const getSentimentIcon = (rating) => {
    if (typeof rating === 'string') {
        if (rating === 'positive') return Smile;
        if (rating === 'neutral') return Meh;
        return Frown;
    }
    if (rating >= 4) return Smile;
    if (rating >= 3) return Meh;
    return Frown;
};

const getRatingNumber = (rating) => {
    if (typeof rating === 'number') return rating;
    if (rating === 'positive') return 5;
    if (rating === 'neutral') return 3;
    return 2;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const parseTags = (rawTags) => {
    if (!rawTags) return [];
    if (Array.isArray(rawTags)) return rawTags;
    try {
        const parsed = JSON.parse(rawTags);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

// =============================================================================
// Review Card Component
// =============================================================================

const ReviewCard = ({ review, onDelete }) => {
    const SentimentIcon = getSentimentIcon(review.rating);
    const ratingNum = getRatingNumber(review.rating);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors"
        >
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                    <h3 className="font-tenor text-lg text-white mb-1">
                        {review.title || 'Untitled Review'}
                    </h3>
                    {review.placeTitle && (
                        <p className="font-manrope text-xs text-white/50 mb-1">
                            {review.placeTitle}
                        </p>
                    )}
                    <p className="font-manrope text-xs text-white/40">
                        {formatDate(review.date)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <SentimentIcon className="w-5 h-5 text-white/60" />
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-3 h-3 ${i < ratingNum ? 'text-white fill-white' : 'text-white/20'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <p className="font-manrope text-sm text-white/70 leading-relaxed mb-4 line-clamp-3">
                {review.content}
            </p>

            <div className="flex items-center justify-between">
                {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {review.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-xs"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
                <button
                    onClick={() => onDelete(review.id)}
                    className="p-2 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                    title="Delete review"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

const SavedPlaceCard = ({ place, onRemove }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors"
        >
            <Link to={`/place/${place.id}`} className="block">
                <img
                    src={place.imagePath}
                    alt={place.titleVi || place.title}
                    className="w-full h-40 object-cover"
                />
                <div className="p-4">
                    <h3 className="font-tenor text-lg text-white mb-2">
                        {place.titleVi || place.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/50 text-sm font-manrope">
                        <MapPin className="w-4 h-4" />
                        <span>{place.locationVi || place.location}</span>
                    </div>
                </div>
            </Link>
            <div className="px-4 pb-4">
                <button
                    onClick={() => onRemove(place.id)}
                    className="w-full py-2 rounded-lg border border-white/10 text-white/70 hover:text-rose-300 hover:border-rose-300/30 hover:bg-rose-500/10 transition-colors text-sm"
                >
                    Remove from saved
                </button>
            </div>
        </motion.div>
    );
};

// =============================================================================
// User Profile Page
// =============================================================================

const UserProfile = () => {
    const { user, token, isAuthenticated, isLoading, updateUser } = useAuth();
    const navigate = useNavigate();
    const [userReviews, setUserReviews] = useState([]);
    const [savedPlaces, setSavedPlaces] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [avatarModalOpen, setAvatarModalOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [changingPassword, setChangingPassword] = useState(false);

    const displayedAvatar = useMemo(() => {
        if (user?.avatar && String(user.avatar).trim()) return user.avatar;
        return null;
    }, [user?.avatar]);

    // Redirect to home if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, isLoading, navigate]);

    // Load user profile data from API
    useEffect(() => {
        if (!isAuthenticated || !user || !token) {
            setLoadingProfile(false);
            return;
        }

        let cancelled = false;

        const fetchProfileData = async () => {
            try {
                setLoadingProfile(true);

                const [favoritesRes, reviewsRes] = await Promise.all([
                    fetch(`${API_BASE}/favorites`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_BASE}/reviews?userId=${user.id}&limit=200`),
                ]);

                if (!cancelled) {
                    if (favoritesRes.ok) {
                        const favoritesData = await favoritesRes.json();
                        const places = (favoritesData.favorites || [])
                            .map((favorite) => favorite.place)
                            .filter(Boolean);
                        setSavedPlaces(places);
                    } else {
                        setSavedPlaces([]);
                    }

                    if (reviewsRes.ok) {
                        const reviewsData = await reviewsRes.json();
                        const mappedReviews = (reviewsData.reviews || []).map((review) => ({
                            id: review.id,
                            title: review.title,
                            content: review.content,
                            rating: review.rating,
                            tags: parseTags(review.tags),
                            placeTitle: review.place?.title,
                            date: review.createdAt,
                        }));
                        setUserReviews(mappedReviews);
                    } else {
                        setUserReviews([]);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    console.error('Failed to load profile data:', e);
                    setSavedPlaces([]);
                    setUserReviews([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingProfile(false);
                }
            }
        };

        fetchProfileData();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user, token]);

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        try {
            const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete review');
            }

            setUserReviews((prev) => prev.filter((review) => review.id !== reviewId));
        } catch (e) {
            alert(e.message || 'Failed to delete review');
        }
    };

    const handleRemoveSaved = async (placeId) => {
        try {
            const response = await fetch(`${API_BASE}/favorites?placeId=${placeId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to remove saved place');
            }

            setSavedPlaces((prev) => prev.filter((place) => place.id !== placeId));
        } catch (e) {
            alert(e.message || 'Failed to remove saved place');
        }
    };

    // Show loading state
    if (isLoading || loadingProfile) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    // Don't render if not authenticated
    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <article className="min-h-screen bg-slate-950 text-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-16 overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-12"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-manrope text-sm">Back</span>
                    </button>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                        className="text-center"
                    >
                        {/* Avatar */}
                        <motion.div
                            variants={fadeInUp}
                            className="mb-6"
                        >
                            <div className="relative inline-block">
                                <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center border-4 border-white/20">
                                    {displayedAvatar ? (
                                        <img
                                            src={displayedAvatar}
                                            alt={user.name || user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-16 h-16 text-white/70" strokeWidth={1.5} />
                                    )}
                                </div>
                                <div className="absolute inset-0 rounded-full ring-4 ring-white/10 ring-offset-4 ring-offset-slate-950" />

                                <button
                                    type="button"
                                    onClick={() => { setAvatarUrl(displayedAvatar || ''); setAvatarModalOpen(true); }}
                                    className="
                                        absolute -bottom-1 -right-1
                                        w-11 h-11 rounded-full
                                        bg-white text-slate-900
                                        flex items-center justify-center
                                        shadow-lg
                                        hover:bg-white/90 active:scale-95 transition
                                    "
                                    aria-label="Change avatar"
                                    title="Change avatar"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>

                        {/* Name */}
                        <motion.h1
                            variants={fadeInUp}
                            className="font-tenor text-4xl md:text-5xl mb-3"
                        >
                            {user.name || user.username}
                        </motion.h1>

                        {/* Email */}
                        <motion.p
                            variants={fadeInUp}
                            className="font-manrope text-lg text-white/50"
                        >
                            {user.email}
                        </motion.p>

                        {/* Stats */}
                        <motion.div
                            variants={fadeInUp}
                            className="flex items-center justify-center gap-8 mt-8"
                        >
                            <div className="text-center">
                                <p className="font-tenor text-2xl text-white">{savedPlaces.length}</p>
                                <p className="font-manrope text-xs text-white/40 uppercase tracking-wider">Saved</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center">
                                <p className="font-tenor text-2xl text-white">{userReviews.length}</p>
                                <p className="font-manrope text-xs text-white/40 uppercase tracking-wider">Reviews</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Content Sections */}
            <section className="pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section: Security */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="mb-12"
                    >
                        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
                            <KeyRound className="w-5 h-5 text-white/60" />
                            <h2 className="font-tenor text-2xl">Security</h2>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10">
                            <p className="font-manrope text-sm text-white/50 mb-5">
                                Change your password. You will stay logged in after changing it.
                            </p>

                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!token) return;
                                    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
                                        alert('Please fill all fields.');
                                        return;
                                    }
                                    if (passwordForm.newPassword.length < 6) {
                                        alert('New password must be at least 6 characters.');
                                        return;
                                    }
                                    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                                        alert('Password confirmation does not match.');
                                        return;
                                    }

                                    setChangingPassword(true);
                                    try {
                                        const res = await fetch(`${API_BASE}/auth/change-password`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                Authorization: `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                                currentPassword: passwordForm.currentPassword,
                                                newPassword: passwordForm.newPassword,
                                            }),
                                        });
                                        const data = await res.json().catch(() => ({}));
                                        if (!res.ok) {
                                            throw new Error(data.error || 'Change password failed');
                                        }
                                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        alert('Password updated.');
                                    } catch (err) {
                                        alert(err.message || 'Change password failed');
                                    } finally {
                                        setChangingPassword(false);
                                    }
                                }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                                    placeholder="Current password"
                                    className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
                                />
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                                    placeholder="New password"
                                    className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
                                />
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                    placeholder="Confirm new password"
                                    className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
                                />

                                <div className="md:col-span-3 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        className="px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-white/90 disabled:opacity-60 transition"
                                    >
                                        Update password
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>

                    {/* Section: Saved Places */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="mb-12"
                    >
                        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
                            <Heart className="w-5 h-5 text-white/60" />
                            <h2 className="font-tenor text-2xl">Saved Places</h2>
                        </motion.div>

                        {savedPlaces.length > 0 ? (
                            <motion.div
                                variants={fadeInUp}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {savedPlaces.map((place) => (
                                    <SavedPlaceCard
                                        key={place.id}
                                        place={place}
                                        onRemove={handleRemoveSaved}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                variants={fadeInUp}
                                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center"
                            >
                                <MapPin className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <p className="font-manrope text-white/40">
                                    You have not saved any places yet
                                </p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Section: My Reviews */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                    >
                        <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-white/60" />
                                <h2 className="font-tenor text-2xl">My Reviews</h2>
                            </div>
                            <Link
                                to="/community"
                                className="font-manrope text-sm text-slate-400 hover:text-slate-300 transition-colors"
                            >
                                Write a Review →
                            </Link>
                        </motion.div>

                        {userReviews.length > 0 ? (
                            <motion.div
                                variants={fadeInUp}
                                className="grid gap-4"
                            >
                                {userReviews.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        onDelete={handleDeleteReview}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                variants={fadeInUp}
                                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center"
                            >
                                <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <p className="font-manrope text-white/40 mb-4">
                                    No reviews written yet
                                </p>
                                <Link
                                    to="/community"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                                >
                                    Write Your First Review
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Avatar modal */}
            {avatarModalOpen && (
                <div
                    className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
                    onClick={() => { if (!savingAvatar) setAvatarModalOpen(false); }}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-tenor text-2xl">Update avatar</h3>
                            <button
                                type="button"
                                onClick={() => setAvatarModalOpen(false)}
                                className="text-white/60 hover:text-white"
                                disabled={savingAvatar}
                            >
                                Close
                            </button>
                        </div>

                        <p className="font-manrope text-sm text-white/50 mb-4">
                            Paste an image URL. Leave empty to remove your avatar.
                        </p>

                        <input
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white mb-5"
                        />

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setAvatarModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition"
                                disabled={savingAvatar}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!token) return;
                                    setSavingAvatar(true);
                                    try {
                                        const res = await fetch(`${API_BASE}/users/me`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                Authorization: `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({ avatar: avatarUrl.trim() || null }),
                                        });
                                        const data = await res.json().catch(() => ({}));
                                        if (!res.ok) {
                                            throw new Error(data.error || 'Update avatar failed');
                                        }
                                        if (data.user) {
                                            updateUser(data.user);
                                        }
                                        setAvatarModalOpen(false);
                                    } catch (err) {
                                        alert(err.message || 'Update avatar failed');
                                    } finally {
                                        setSavingAvatar(false);
                                    }
                                }}
                                className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-semibold hover:bg-white/90 disabled:opacity-60 transition"
                                disabled={savingAvatar}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
};

export default UserProfile;

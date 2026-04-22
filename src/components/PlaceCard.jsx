import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';
import LoginModal from './LoginModal';

const PlaceCard = ({ place }) => {
    const { i18n } = useTranslation();
    const { token, isAuthenticated } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [isTogglingLike, setIsTogglingLike] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const isVietnamese = i18n.language === 'vi';

    // Get translated title and location
    const title = isVietnamese && place.titleVi ? place.titleVi : place.title;
    const location = isVietnamese && place.locationVi ? place.locationVi : place.location;

    useEffect(() => {
        const fetchFavoriteState = async () => {
            if (!isAuthenticated || !token) {
                setIsLiked(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/favorites`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const favorites = Array.isArray(data.favorites) ? data.favorites : [];
                const hasSaved = favorites.some((favorite) => favorite.placeId === place.id || favorite.place?.id === place.id);
                setIsLiked(hasSaved);
            } catch (e) {
                console.error('Failed to fetch favorites:', e);
            }
        };

        fetchFavoriteState();
    }, [isAuthenticated, token, place.id]);

    const handleToggleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated || !token) {
            setLoginModalOpen(true);
            return;
        }

        setIsTogglingLike(true);

        try {
            const response = await fetch(
                isLiked ? `${API_BASE}/favorites?placeId=${place.id}` : `${API_BASE}/favorites`,
                {
                    method: isLiked ? 'DELETE' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: isLiked ? undefined : JSON.stringify({ placeId: place.id }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update favorite');
            }

            setIsLiked((prev) => !prev);
        } catch (err) {
            alert(err.message || 'Failed to update favorite');
        } finally {
            setIsTogglingLike(false);
        }
    };

    return (
        <>
            <Link
                to={`/place/${place.id}`}
                className="
                    relative flex-shrink-0 w-[280px] md:w-[320px]
                    snap-start scroll-ml-5
                    group cursor-pointer
                    block
                "
            >
                {/* Image Container with 3:4 Aspect Ratio */}
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-primary/5">
                    {/* Skeleton loader */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10 animate-pulse" />
                    )}

                    <img
                        src={place.image || place.imagePath}
                        alt={title}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                        className={`
                            absolute inset-0 w-full h-full object-cover
                            transition-all duration-500 ease-out
                            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                            group-hover:scale-105 group-active:scale-105
                        `}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    />

                    {/* Gradient Overlay */}
                    <div className="
                        absolute inset-0 
                        bg-gradient-to-t from-foreground/60 via-transparent to-transparent
                        opacity-70 group-hover:opacity-90 transition-opacity duration-300
                    " />

                    {/* Category Tag */}
                    <div className="
                        absolute top-4 left-4 
                        px-3 py-1.5 rounded-full
                        bg-white/80 backdrop-blur-sm
                        text-xs font-manrope font-medium text-foreground/80
                        z-10
                    ">
                        {place.category?.name || place.category}
                    </div>

                    {/* Like Button */}
                    <button
                        onClick={handleToggleLike}
                        disabled={isTogglingLike}
                        className="
                            absolute top-4 right-4 
                            p-2 rounded-full
                            bg-white/80 backdrop-blur-sm
                            hover:bg-white transition-colors duration-200
                            z-10
                        "
                        aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Heart
                            className={`
                                w-4 h-4 transition-all duration-300
                                ${isLiked ? 'fill-accent text-accent scale-110' : 'text-foreground/60'}
                            `}
                            strokeWidth={1.5}
                        />
                    </button>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                        <h3 className="font-tenor text-lg text-white mb-1 leading-tight">
                            {title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-white/80">
                            <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span className="text-xs font-manrope font-light">
                                {location}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
        </>
    );
};

export default PlaceCard;

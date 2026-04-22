import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, Pencil, Plus, Save, Shield, Trash2, Users } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';

const defaultForm = {
    title: '',
    titleVi: '',
    location: '',
    locationVi: '',
    description: '',
    descriptionVi: '',
    imagePath: '',
    googleMapsLink: '',
    openingHours: '',
    phone: '',
    latitude: '',
    longitude: '',
    categoryName: 'Nature',
    indoorSuitable: false,
    designerTip: '',
};

const AdminPlaces = () => {
    const navigate = useNavigate();
    const { user, token, isAuthenticated, isLoading } = useAuth();

    const [places, setPlaces] = useState([]);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(defaultForm);
    const [editingId, setEditingId] = useState(null);
    const [loadingData, setLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('places'); // places | users
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [savingUserId, setSavingUserId] = useState(null);

    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !isAdmin)) {
            navigate('/');
        }
    }, [isLoading, isAuthenticated, isAdmin, navigate]);

    useEffect(() => {
        const fetchPlaces = async () => {
            if (!isAuthenticated || !isAdmin) {
                setLoadingData(false);
                return;
            }

            try {
                setLoadingData(true);
                const response = await fetch(`${API_BASE}/places?limit=500`);
                if (!response.ok) {
                    throw new Error('Failed to load places');
                }

                const data = await response.json();
                setPlaces(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                setPlaces([]);
            } finally {
                setLoadingData(false);
            }
        };

        fetchPlaces();
    }, [isAuthenticated, isAdmin]);

    const fetchUsers = async () => {
        if (!token) return;
        try {
            setLoadingUsers(true);
            const res = await fetch(`${API_BASE}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load users');
            }
            setUsers(Array.isArray(data.users) ? data.users : []);
        } catch (e) {
            console.error(e);
            setUsers([]);
            alert(e.message || 'Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users' && isAuthenticated && isAdmin) {
            fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, isAuthenticated, isAdmin]);

    const categories = useMemo(() => {
        const unique = new Set();
        places.forEach((place) => {
            if (place.category?.name) unique.add(place.category.name);
        });

        const fallback = [
            'Nature',
            'Lake',
            'Café',
            'Waterfall',
            'Street',
            'Architecture',
            'Historic Stay',
            'Adventure',
            'Park',
            'Local Experience',
            'Scenic',
            'Restaurant',
            'Street Food',
            'Temple',
            'Garden',
        ];

        const merged = [...new Set([...fallback, ...Array.from(unique)])];
        return merged.sort((a, b) => a.localeCompare(b));
    }, [places]);

    const resetForm = () => {
        setForm(defaultForm);
        setEditingId(null);
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const normalizePayload = () => {
        const latitude = form.latitude.trim() === '' ? undefined : Number.parseFloat(form.latitude);
        const longitude = form.longitude.trim() === '' ? undefined : Number.parseFloat(form.longitude);

        return {
            title: form.title.trim(),
            titleVi: form.titleVi.trim() || undefined,
            location: form.location.trim(),
            locationVi: form.locationVi.trim() || undefined,
            description: form.description.trim(),
            descriptionVi: form.descriptionVi.trim() || undefined,
            imagePath: form.imagePath.trim(),
            googleMapsLink: form.googleMapsLink.trim() || undefined,
            openingHours: form.openingHours.trim() || undefined,
            phone: form.phone.trim() || undefined,
            latitude: Number.isFinite(latitude) ? latitude : undefined,
            longitude: Number.isFinite(longitude) ? longitude : undefined,
            categoryName: form.categoryName,
            indoorSuitable: !!form.indoorSuitable,
            designerTip: form.designerTip.trim() || undefined,
        };
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = normalizePayload();
        if (!payload.title || !payload.location || !payload.description || !payload.imagePath || !payload.categoryName) {
            alert('Please fill all required fields.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                editingId ? `${API_BASE}/places/${editingId}` : `${API_BASE}/places`,
                {
                    method: editingId ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                },
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save place');
            }

            if (editingId) {
                setPlaces((prev) => prev.map((item) => (item.id === editingId ? data : item)));
            } else {
                setPlaces((prev) => [data, ...prev]);
            }

            resetForm();
        } catch (e) {
            alert(e.message || 'Failed to save place');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (place) => {
        setEditingId(place.id);
        setForm({
            title: place.title || '',
            titleVi: place.titleVi || '',
            location: place.location || '',
            locationVi: place.locationVi || '',
            description: place.description || '',
            descriptionVi: place.descriptionVi || '',
            imagePath: place.imagePath || '',
            googleMapsLink: place.googleMapsLink || '',
            openingHours: place.openingHours || '',
            phone: place.phone || '',
            latitude: place.latitude ?? '',
            longitude: place.longitude ?? '',
            categoryName: place.category?.name || 'Nature',
            indoorSuitable: !!place.indoorSuitable,
            designerTip: place.designerTip || '',
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (placeId) => {
        if (!window.confirm('Delete this place? Reviews and favorites related to it will also be removed.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/places/${placeId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete place');
            }

            setPlaces((prev) => prev.filter((place) => place.id !== placeId));
            if (editingId === placeId) {
                resetForm();
            }
        } catch (e) {
            alert(e.message || 'Failed to delete place');
        }
    };

    if (isLoading || loadingData) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <article className="min-h-screen bg-slate-950 text-white pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <h1 className="font-tenor text-3xl md:text-4xl">Admin Dashboard</h1>
                </div>

                <p className="font-manrope text-white/60 mb-8 max-w-3xl">
                    Manage places and users. Changes take effect immediately.
                </p>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab('places')}
                        className={`px-4 py-2 rounded-xl border transition ${
                            activeTab === 'places'
                                ? 'bg-white text-slate-900 border-white'
                                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Places
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-xl border transition ${
                            activeTab === 'users'
                                ? 'bg-white text-slate-900 border-white'
                                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <Users className="w-4 h-4" /> Users
                        </span>
                    </button>
                </div>

                {activeTab === 'users' ? (
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-tenor text-2xl">User management</h2>
                            <button
                                type="button"
                                onClick={fetchUsers}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
                                disabled={loadingUsers}
                            >
                                Refresh
                            </button>
                        </div>

                        {loadingUsers ? (
                            <div className="py-10 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-white/60">
                                            <th className="text-left py-3 pr-4">ID</th>
                                            <th className="text-left py-3 pr-4">Email</th>
                                            <th className="text-left py-3 pr-4">Username</th>
                                            <th className="text-left py-3 pr-4">Role</th>
                                            <th className="text-left py-3 pr-4">Avatar</th>
                                            <th className="text-right py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {users.map((u) => (
                                            <tr key={u.id} className="align-top">
                                                <td className="py-4 pr-4 text-white/50">{u.id}</td>
                                                <td className="py-4 pr-4">
                                                    <input
                                                        defaultValue={u.email}
                                                        className="w-[240px] px-3 py-2 rounded-lg bg-slate-900 border border-white/10"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, email: value } : x)));
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-4 pr-4">
                                                    <input
                                                        defaultValue={u.username}
                                                        className="w-[160px] px-3 py-2 rounded-lg bg-slate-900 border border-white/10"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, username: value } : x)));
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-4 pr-4">
                                                    <select
                                                        value={u.role}
                                                        className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: value } : x)));
                                                        }}
                                                    >
                                                        <option value="VISITOR">VISITOR</option>
                                                        <option value="ADMIN">ADMIN</option>
                                                    </select>
                                                </td>
                                                <td className="py-4 pr-4">
                                                    <input
                                                        defaultValue={u.avatar || ''}
                                                        placeholder="https://..."
                                                        className="w-[240px] px-3 py-2 rounded-lg bg-slate-900 border border-white/10"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setUsers((prev) =>
                                                                prev.map((x) =>
                                                                    x.id === u.id ? { ...x, avatar: value.trim() || null } : x,
                                                                ),
                                                            );
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-4 text-right whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!token) return;
                                                            const current = users.find((x) => x.id === u.id);
                                                            if (!current) return;

                                                            setSavingUserId(u.id);
                                                            try {
                                                                const res = await fetch(`${API_BASE}/admin/users/${u.id}`, {
                                                                    method: 'PATCH',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        Authorization: `Bearer ${token}`,
                                                                    },
                                                                    body: JSON.stringify({
                                                                        email: current.email,
                                                                        username: current.username,
                                                                        role: current.role,
                                                                        avatar: current.avatar ?? null,
                                                                    }),
                                                                });
                                                                const data = await res.json().catch(() => ({}));
                                                                if (!res.ok) {
                                                                    throw new Error(data.error || 'Update failed');
                                                                }
                                                                alert('User updated.');
                                                            } catch (e) {
                                                                alert(e.message || 'Update failed');
                                                            } finally {
                                                                setSavingUserId(null);
                                                            }
                                                        }}
                                                        disabled={savingUserId === u.id}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:bg-white/90 disabled:opacity-60 transition mr-2"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!token) return;
                                                            const newPassword = window.prompt('Enter a new password (min 6 chars)');
                                                            if (!newPassword) return;
                                                            if (newPassword.length < 6) {
                                                                alert('Password must be at least 6 characters.');
                                                                return;
                                                            }

                                                            setSavingUserId(u.id);
                                                            try {
                                                                const res = await fetch(`${API_BASE}/admin/users/${u.id}`, {
                                                                    method: 'PATCH',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        Authorization: `Bearer ${token}`,
                                                                    },
                                                                    body: JSON.stringify({ newPassword }),
                                                                });
                                                                const data = await res.json().catch(() => ({}));
                                                                if (!res.ok) {
                                                                    throw new Error(data.error || 'Reset failed');
                                                                }
                                                                alert('Password reset.');
                                                            } catch (e) {
                                                                alert(e.message || 'Reset failed');
                                                            } finally {
                                                                setSavingUserId(null);
                                                            }
                                                        }}
                                                        disabled={savingUserId === u.id}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition disabled:opacity-60"
                                                    >
                                                        <KeyRound className="w-4 h-4" />
                                                        Reset PW
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        <motion.form
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10"
                        >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="title" value={form.title} onChange={handleChange} placeholder="Title *" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <input name="titleVi" value={form.titleVi} onChange={handleChange} placeholder="Title (Vietnamese)" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <input name="location" value={form.location} onChange={handleChange} placeholder="Location *" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <input name="locationVi" value={form.locationVi} onChange={handleChange} placeholder="Location (Vietnamese)" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <input name="imagePath" value={form.imagePath} onChange={handleChange} placeholder="Image URL *" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <input name="googleMapsLink" value={form.googleMapsLink} onChange={handleChange} placeholder="Google Maps link" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <input name="openingHours" value={form.openingHours} onChange={handleChange} placeholder="Opening hours" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Latitude" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Longitude" className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                        <select name="categoryName" value={form.categoryName} onChange={handleChange} className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10">
                            {categories.map((categoryName) => (
                                <option key={categoryName} value={categoryName}>
                                    {categoryName}
                                </option>
                            ))}
                        </select>
                        <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-sm text-white/80">
                            <input type="checkbox" name="indoorSuitable" checked={form.indoorSuitable} onChange={handleChange} />
                            Indoor suitable
                        </label>
                    </div>

                    <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description *" rows={3} className="mt-4 w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                    <textarea name="descriptionVi" value={form.descriptionVi} onChange={handleChange} placeholder="Description (Vietnamese)" rows={3} className="mt-4 w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />
                    <textarea name="designerTip" value={form.designerTip} onChange={handleChange} placeholder="Designer tip" rows={2} className="mt-4 w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10" />

                    <div className="flex items-center gap-3 mt-5">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition-colors"
                        >
                            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {editingId ? 'Update Place' : 'Create Place'}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
                            >
                                Cancel edit
                            </button>
                        )}
                    </div>
                        </motion.form>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {places.map((place) => (
                                <div key={place.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                    <img src={place.imagePath} alt={place.title} className="w-full h-40 object-cover" />
                                    <div className="p-4">
                                        <p className="text-xs text-white/50 mb-2">{place.category?.name || 'Unknown'}</p>
                                        <h3 className="font-tenor text-xl mb-2">{place.titleVi || place.title}</h3>
                                        <p className="text-sm text-white/60 line-clamp-2 mb-4">{place.locationVi || place.location}</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(place)}
                                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                                            >
                                                <Pencil className="w-4 h-4" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(place.id)}
                                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-sm"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                            <Link to={`/place/${place.id}`} className="ml-auto text-xs text-white/50 hover:text-white">
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </article>
    );
};

export default AdminPlaces;

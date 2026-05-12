import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, LogIn, LogOut, Package, Calendar, Clock, CheckCircle2, XCircle, TrendingUp, Star, Percent, Users, MessageSquare, Mail, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function AdminDashboard() {
    // Auth state
    const [session, setSession] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Dashboard state
    const [activeTab, setActiveTab] = useState<'products' | 'appointments' | 'reviews' | 'messages'>('products');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalAppointments: 0,
        pendingAppointments: 0,
        promoProducts: 0,
        featuredProducts: 0,
        pendingReviews: 0,
        unreadMessages: 0
    });

    // Products state
    const [products, setProducts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        category: 'Solaires',
        gender: 'Unisex',
        price: 0,
        image_url: '',
        hover_image_url: '',
        model_3d_url: '',
        is_new: false,
        is_promotion: false,
        is_featured: false,
        description: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [hoverImageFile, setHoverImageFile] = useState<File | null>(null);
    const [tryOnImageFile, setTryOnImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Appointments state
    const [appointments, setAppointments] = useState<any[]>([]);

    // Reviews state
    const [reviews, setReviews] = useState<any[]>([]);

    // Messages state
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
    }, []);

    useEffect(() => {
        if (session) {
            if (activeTab === 'products') {
                fetchProducts();
            } else if (activeTab === 'appointments') {
                fetchAppointments();
            } else if (activeTab === 'reviews') {
                fetchReviews();
            } else {
                fetchMessages();
            }
            
            // Always fetch counts for notifications
            fetchPendingCounts();
        }
    }, [session, activeTab]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setLoginError('Email ou mot de passe incorrect.');
        setLoginLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) {
            setProducts(data);
            setStats(prev => ({
                ...prev,
                totalProducts: data.length,
                promoProducts: data.filter(p => p.is_promotion).length,
                featuredProducts: data.filter(p => p.is_featured).length
            }));
        }
        setLoading(false);
    }

    async function fetchPendingCounts() {
        const { count: pendingApps } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingRevs } = await supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: unreadMsgs } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'unread');
        setStats(prev => ({
            ...prev,
            pendingAppointments: pendingApps || 0,
            pendingReviews: pendingRevs || 0,
            unreadMessages: unreadMsgs || 0
        }));
    }

    async function fetchReviews() {
        setLoading(true);
        const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (data) setReviews(data);
        setLoading(false);
    }

    const handleApproveReview = async (id: string) => {
        const { error } = await supabase.from('reviews').update({ status: 'approved' }).eq('id', id);
        if (!error) {
            fetchReviews();
            fetchPendingCounts();
        }
    };

    const handleDeleteReview = async (id: string) => {
        if (!window.confirm('Supprimer cet avis ?')) return;
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (!error) {
            fetchReviews();
            fetchPendingCounts();
        }
    };

    async function fetchMessages() {
        setLoading(true);
        const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
        if (data) setMessages(data);
        setLoading(false);
    }

    const handleMarkAsRead = async (id: string) => {
        const { error } = await supabase.from('contacts').update({ status: 'read' }).eq('id', id);
        if (!error) {
            fetchMessages();
            fetchPendingCounts();
        }
    };

    const handleDeleteMessage = async (id: string) => {
        if (!window.confirm('Supprimer ce message ?')) return;
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (!error) {
            fetchMessages();
            fetchPendingCounts();
        }
    };

    async function fetchAppointments() {
        setLoading(true);
        const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: false });
        if (data) {
            setAppointments(data);
        }
        setLoading(false);
    }

    const handleUpdateAppointmentStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
        if (!error) {
            fetchAppointments();
        } else {
            alert(`Erreur: ${error.message}`);
        }
    };

    const handleOpenModal = (product: any = null) => {
        if (product) {
            setEditingId(product.id);
            setFormData({
                name: product.name || '',
                brand: product.brand || '',
                category: product.category || 'Solaires',
                gender: product.gender || 'Unisex',
                price: product.price || 0,
                image_url: product.image_url || '',
                hover_image_url: product.hover_image_url || '',
                model_3d_url: product.model_3d_url || '',
                is_new: product.is_new || false,
                is_promotion: product.is_promotion || false,
                is_featured: product.is_featured || false,
                description: product.description || '',
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                brand: '',
                category: 'Solaires',
                gender: 'Unisex',
                price: 0,
                image_url: '',
                hover_image_url: '',
                model_3d_url: '',
                is_new: false,
                is_promotion: false,
                is_featured: false,
                description: '',
            });
        }
        setImageFile(null);
        setHoverImageFile(null);
        setTryOnImageFile(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalImageUrl = formData.image_url;
            let finalHoverImageUrl = formData.hover_image_url;
            let finalTryOnImageUrl = formData.model_3d_url;

            // Upload image if a new file is selected
            if (imageFile) {
                setUploading(true);
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `products/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);
                
                finalImageUrl = publicUrl;
                setUploading(false);
            }

            // Upload hover image
            if (hoverImageFile) {
                setUploading(true);
                const fileExt = hoverImageFile.name.split('.').pop();
                const fileName = `hover_${Math.random()}.${fileExt}`;
                const filePath = `products/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, hoverImageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);
                
                finalHoverImageUrl = publicUrl;
                setUploading(false);
            }

            // Upload Try-On PNG
            if (tryOnImageFile) {
                setUploading(true);
                const fileExt = tryOnImageFile.name.split('.').pop();
                const fileName = `tryon_${Math.random()}.${fileExt}`;
                const filePath = `products/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, tryOnImageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);
                
                finalTryOnImageUrl = publicUrl;
                setUploading(false);
            }

            const submissionData = { ...formData, image_url: finalImageUrl, hover_image_url: finalHoverImageUrl, model_3d_url: finalTryOnImageUrl };

            if (editingId) {
                const { error } = await supabase.from('products').update(submissionData).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('products').insert([submissionData]);
                if (error) throw error;
            }
            handleCloseModal();
            fetchProducts();
        } catch (err: any) {
            alert(`Erreur: ${err.message}`);
            setUploading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce produit ?')) {
            try {
                const { error } = await supabase.from('products').delete().eq('id', id);
                if (error) throw error;
                fetchProducts();
            } catch (err: any) {
                alert(`Erreur: ${err.message}`);
            }
        }
    };

    const categories = ['Solaires', 'Médicales', 'Accessoires'];
    const genders = ['Homme', 'Femme', 'Enfants', 'Unisex'];

    if (!session) {
        return (
            <div className="min-h-screen bg-bel-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-serif font-bold text-bel-dark">Connexion Admin</h2>
                </div>
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow-xl rounded-3xl sm:px-10 border border-bel-dark/5">
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div>
                                <label className="block text-sm font-medium text-bel-dark/70">Adresse Email</label>
                                <div className="mt-1">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none"
                                        placeholder="admin@beloptique.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-bel-dark/70">Mot de passe</label>
                                <div className="mt-1">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                            <div>
                                <button
                                    type="submit"
                                    disabled={loginLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-bel-dark hover:bg-bel-accent hover:text-bel-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bel-accent disabled:opacity-50 transition-colors"
                                >
                                    {loginLoading ? 'Connexion...' : 'Se connecter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-bel-light min-h-screen pb-12">
            <div className="bg-white shadow-sm border-b border-gray-200 mb-8 pt-6 pb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="font-serif text-3xl font-bold text-bel-dark">Administration</h1>
                            <p className="text-bel-dark/60 text-sm">Connecté en tant que {session.user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-sm font-medium text-gray-500 hover:text-bel-dark transition-colors"
                        >
                            <LogOut size={18} className="mr-2" /> Déconnexion
                        </button>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-bel-dark text-white' : 'text-gray-500 hover:text-bel-dark'}`}
                        >
                            <Package size={18} className="inline-block mr-2" /> Produits
                        </button>
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${activeTab === 'appointments' ? 'bg-bel-dark text-white' : 'text-gray-500 hover:text-bel-dark'}`}
                        >
                            <Calendar size={18} className="inline-block mr-2" /> Rendez-vous
                            {stats.pendingAppointments > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                                    {stats.pendingAppointments}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${activeTab === 'reviews' ? 'bg-bel-dark text-white' : 'text-gray-500 hover:text-bel-dark'}`}
                        >
                            <Users size={18} className="inline-block mr-2" /> Avis
                            {stats.pendingReviews > 0 && (
                                <span className="absolute -top-1 -right-1 bg-bel-accent text-bel-dark text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse font-bold">
                                    {stats.pendingReviews}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('messages')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${activeTab === 'messages' ? 'bg-bel-dark text-white' : 'text-gray-500 hover:text-bel-dark'}`}
                        >
                            <MessageSquare size={18} className="inline-block mr-2" /> Messages
                            {stats.unreadMessages > 0 && (
                                <span className="absolute -top-1 -right-1 bg-bel-accent text-bel-dark text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse font-bold">
                                    {stats.unreadMessages}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-bel-dark/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Produits</span>
                            <Package size={18} className="text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-bel-dark">{stats.totalProducts}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-bel-dark/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">RDV en attente</span>
                            <Clock size={18} className="text-yellow-500" />
                        </div>
                        <div className="text-2xl font-bold text-bel-dark">{stats.pendingAppointments}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-bel-dark/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">En Vedette</span>
                            <Star size={18} className="text-bel-accent" />
                        </div>
                        <div className="text-2xl font-bold text-bel-dark">{stats.featuredProducts}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-bel-dark/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">En Promotion</span>
                            <Percent size={18} className="text-red-500" />
                        </div>
                        <div className="text-2xl font-bold text-bel-dark">{stats.promoProducts}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-bel-dark/5 col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total RDV</span>
                            <Users size={18} className="text-green-500" />
                        </div>
                        <div className="text-2xl font-bold text-bel-dark">{stats.totalAppointments}</div>
                    </div>
                </div>
                {activeTab === 'products' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-medium text-bel-dark">Gestion du Catalogue</h2>
                            <button
                                onClick={() => handleOpenModal()}
                                className="bg-bel-dark text-white px-5 py-2.5 rounded-xl font-medium hover:bg-bel-accent hover:text-bel-dark transition-colors flex items-center text-sm"
                            >
                                <Plus size={18} className="mr-2" /> Nouveau
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl shadow-xl border border-bel-dark/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-bel-gray/50 text-bel-dark text-xs tracking-wider uppercase border-b border-gray-100">
                                            <th className="px-6 py-4 font-medium">Image</th>
                                            <th className="px-6 py-4 font-medium">Nom & Marque</th>
                                            <th className="px-6 py-4 font-medium">Catégorie</th>
                                            <th className="px-6 py-4 font-medium">Prix ($)</th>
                                            <th className="px-6 py-4 font-medium">Statut</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center">
                                                    <div className="w-8 h-8 border-4 border-bel-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                                                </td>
                                            </tr>
                                        ) : products.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-bel-dark/50">
                                                    Aucun produit trouvé.
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product) => (
                                                <tr key={product.id} className="hover:bg-bel-gray/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="w-12 h-12 bg-bel-gray rounded-xl overflow-hidden flex items-center justify-center">
                                                            {product.image_url ? (
                                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                                                            ) : (
                                                                <ImageIcon className="text-bel-dark/30" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-bel-dark text-sm">{product.name}</div>
                                                        <div className="text-xs text-bel-accent uppercase tracking-wider font-medium">{product.brand}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                            {product.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-sm">
                                                        {product.price ? `$${product.price}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 space-x-1">
                                                        {product.is_new && (
                                                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold">NEW</span>
                                                        )}
                                                        {product.is_promotion && (
                                                            <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full font-bold">PROMO</span>
                                                        )}
                                                        {product.is_featured && (
                                                            <span className="inline-block px-2 py-0.5 bg-bel-accent/20 text-bel-dark text-[10px] rounded-full font-bold">⭐ VEDETTE</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleOpenModal(product)}
                                                                className="p-1.5 text-gray-400 hover:text-bel-accent hover:bg-bel-accent/10 rounded-lg transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(product.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'appointments' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-medium text-bel-dark">Historique des Rendez-vous</h2>
                        </div>

                        <div className="bg-white rounded-3xl shadow-xl border border-bel-dark/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-bel-gray/50 text-bel-dark text-xs tracking-wider uppercase border-b border-gray-100">
                                            <th className="px-6 py-4 font-medium">Date & Heure</th>
                                            <th className="px-6 py-4 font-medium">Client</th>
                                            <th className="px-6 py-4 font-medium">Localisation</th>
                                            <th className="px-6 py-4 font-medium">Service</th>
                                            <th className="px-6 py-4 font-medium">Statut</th>
                                            <th className="px-6 py-4 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center">
                                                    <div className="w-8 h-8 border-4 border-bel-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                                                </td>
                                            </tr>
                                        ) : appointments.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-bel-dark/50">
                                                    Aucun rendez-vous trouvé.
                                                </td>
                                            </tr>
                                        ) : (
                                            appointments.map((apt) => (
                                                <tr key={apt.id} className="hover:bg-bel-gray/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center text-sm font-medium text-bel-dark">
                                                            <Calendar size={14} className="mr-2 text-gray-400" /> {apt.date}
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                                            <Clock size={14} className="mr-2" /> {apt.time}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-sm text-bel-dark">{apt.name}</div>
                                                        <div className="text-xs text-gray-500">{apt.email}</div>
                                                        <div className="text-xs text-gray-500">{apt.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-bel-dark">{apt.city || '-'}</div>
                                                        <div className="text-xs text-gray-500">{apt.country || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {apt.service}
                                                        {apt.notes && (
                                                            <div className="text-xs text-gray-500 mt-1 italic max-w-xs truncate" title={apt.notes}>
                                                                Note: {apt.notes}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {apt.status === 'pending' && <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center w-max"><Clock size={12} className="mr-1" /> En attente</span>}
                                                        {apt.status === 'confirmed' && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center w-max"><CheckCircle2 size={12} className="mr-1" /> Confirmé</span>}
                                                        {apt.status === 'completed' && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center w-max"><CheckCircle2 size={12} className="mr-1" /> Terminé</span>}
                                                        {apt.status === 'cancelled' && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center w-max"><XCircle size={12} className="mr-1" /> Annulé</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <select
                                                            value={apt.status}
                                                            onChange={(e) => handleUpdateAppointmentStatus(apt.id, e.target.value)}
                                                            className="text-xs border-gray-300 rounded-lg focus:ring-bel-accent focus:border-bel-accent bg-gray-50 text-gray-700 px-2 py-1 outline-none"
                                                        >
                                                            <option value="pending">En attente</option>
                                                            <option value="confirmed">Confirmer</option>
                                                            <option value="completed">Terminer</option>
                                                            <option value="cancelled">Annuler</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Modal - Add / Edit Product */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-bel-dark/60 backdrop-blur-sm"
                            onClick={handleCloseModal}
                        ></motion.div>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h2 className="font-serif text-2xl font-bold text-bel-dark">
                                    {editingId ? 'Modifier le produit' : 'Nouveau produit'}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-bel-dark/70 mb-2">Nom du produit *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-bel-dark/70 mb-2">Marque *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-bel-dark/70 mb-2">Catégorie</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none transition-all"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-bel-dark/70 mb-2">Genre (Public)</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none transition-all"
                                        >
                                            {genders.map((g) => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-bel-dark/70 mb-2">Prix ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 border border-gray-100 rounded-xl bg-white mb-4 shadow-sm">
                                    <label className="block text-base font-bold text-bel-dark mb-1">1. Photo de Présentation (Catalogue)</label>
                                    <p className="text-xs text-bel-dark/60 mb-4">Cette photo sera affichée dans Nos Officines et sur les miniatures.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-bel-dark/80 uppercase tracking-widest mb-2 text-bel-accent">Télécharger (Recommandé)</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                                                className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bel-accent/10 file:text-bel-accent hover:file:bg-bel-accent/20"
                                            />
                                            {uploading && <p className="text-[10px] text-bel-accent mt-2 animate-pulse font-medium">Chargement en cours...</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-bel-dark/40 uppercase tracking-widest mb-2">Ou utiliser une URL</label>
                                            <input
                                                type="url"
                                                value={formData.image_url}
                                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none text-sm"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    {formData.image_url && (
                                        <div className="mt-4 w-32 h-32 rounded-xl border border-gray-200 overflow-hidden bg-bel-gray relative group">
                                            <img src={formData.image_url} alt="Aperçu" className="w-full h-full object-cover mix-blend-multiply" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-xs font-medium">Aperçu Catalogue</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border border-gray-100 rounded-xl bg-white mb-4 shadow-sm">
                                    <label className="block text-base font-bold text-bel-dark mb-1">2. Photo de Survol (Hover Effect)</label>
                                    <p className="text-xs text-bel-dark/60 mb-4">Cette photo apparaîtra au survol de la souris dans le catalogue.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-bel-dark/80 uppercase tracking-widest mb-2 text-bel-accent">Télécharger (Recommandé)</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setHoverImageFile(e.target.files ? e.target.files[0] : null)}
                                                className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bel-accent/10 file:text-bel-accent hover:file:bg-bel-accent/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-bel-dark/40 uppercase tracking-widest mb-2">Ou utiliser une URL</label>
                                            <input
                                                type="url"
                                                value={formData.hover_image_url}
                                                onChange={(e) => setFormData({ ...formData, hover_image_url: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none text-sm"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    {formData.hover_image_url && (
                                        <div className="mt-4 w-32 h-32 rounded-xl border border-gray-200 overflow-hidden bg-bel-gray relative group">
                                            <img src={formData.hover_image_url} alt="Aperçu Hover" className="w-full h-full object-cover mix-blend-multiply" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-xs font-medium">Aperçu Hover</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-bel-accent/5 border-2 border-bel-accent/30 rounded-xl shadow-sm">
                                    <label className="block text-base font-bold text-bel-dark mb-1 flex items-center gap-2">
                                        <Eye size={18} className="text-bel-accent" />
                                        3. Photo d'Essayage Virtuel
                                    </label>
                                    <p className="text-xs text-bel-dark/80 font-medium mb-4 bg-bel-accent/10 p-2 rounded-lg inline-block">
                                        ⚠️ OBLIGATOIRE : Cette image DOIT être un PNG transparent (sans arrière-plan) affichant la lunette parfaitement de face.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-bel-dark/80 uppercase tracking-widest mb-2 text-bel-accent">Télécharger le PNG (Recommandé)</label>
                                            <input
                                                type="file"
                                                accept="image/png"
                                                onChange={(e) => setTryOnImageFile(e.target.files ? e.target.files[0] : null)}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bel-accent/10 file:text-bel-accent hover:file:bg-bel-accent/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-bel-dark/40 uppercase tracking-widest mb-2">Ou utiliser une URL</label>
                                            <input
                                                type="url"
                                                value={formData.model_3d_url}
                                                onChange={(e) => setFormData({ ...formData, model_3d_url: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none text-sm"
                                                placeholder="URL de l'image (optionnel)"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/png"
                                                onChange={(e) => setTryOnImageFile(e.target.files ? e.target.files[0] : null)}
                                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none text-xs"
                                            />
                                        </div>
                                    </div>
                                    {formData.model_3d_url && (
                                        <div className="mt-3 w-32 h-20 rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center p-2">
                                            <img src={formData.model_3d_url} alt="Aperçu PNG" className="max-w-full max-h-full object-contain drop-shadow-md" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-6">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_new}
                                            onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                                            className="w-5 h-5 text-bel-accent focus:ring-bel-accent border-gray-300 rounded"
                                        />
                                        <span className="font-medium text-bel-dark">Nouveauté</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_promotion}
                                            onChange={(e) => setFormData({ ...formData, is_promotion: e.target.checked })}
                                            className="w-5 h-5 text-bel-accent focus:ring-bel-accent border-gray-300 rounded"
                                        />
                                        <span className="font-medium text-bel-dark">En promotion</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                            className="w-5 h-5 text-bel-accent focus:ring-bel-accent border-gray-300 rounded"
                                        />
                                        <span className="font-medium text-bel-dark">Vedette (Accueil)</span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-bel-dark/70 mb-2">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-gray-100 gap-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-6 py-3 rounded-xl font-medium text-bel-dark hover:bg-gray-100 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-bel-dark text-white rounded-xl font-medium hover:bg-bel-accent hover:text-bel-dark transition-colors shadow-lg"
                                    >
                                        {editingId ? 'Mettre à jour' : 'Ajouter'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {activeTab === 'reviews' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-xl border border-bel-dark/5 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-bel-gray/50">
                            <tr className="text-bel-dark text-xs tracking-wider uppercase">
                                <th className="px-6 py-4 text-left font-medium">Client</th>
                                <th className="px-6 py-4 text-left font-medium">Avis</th>
                                <th className="px-6 py-4 text-left font-medium">Note</th>
                                <th className="px-6 py-4 text-left font-medium">Statut</th>
                                <th className="px-6 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {reviews.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-bel-dark/50 italic">Aucun avis reçu.</td></tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-bel-gray/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-bel-dark">{review.name}</div>
                                            <div className="text-xs text-gray-500">{review.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">{review.comment}</div>
                                            <div className="text-[10px] text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-bel-accent">
                                            <div className="flex items-center">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} size={14} className={i < review.rating ? 'fill-current' : 'text-gray-200'} />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${review.status === 'approved' ? 'bg-green-100 text-green-800' : review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {review.status === 'approved' ? 'Publié' : review.status === 'pending' ? 'En attente' : 'Refusé'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex justify-end space-x-2">
                                                {review.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleApproveReview(review.id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors shadow-sm"
                                                        title="Approuver"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {activeTab === 'messages' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-xl border border-bel-dark/5 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-bel-gray/50">
                            <tr className="text-bel-dark text-xs tracking-wider uppercase">
                                <th className="px-6 py-4 text-left font-medium">Expéditeur</th>
                                <th className="px-6 py-4 text-left font-medium">Message</th>
                                <th className="px-6 py-4 text-left font-medium">Statut</th>
                                <th className="px-6 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {messages.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-bel-dark/50 italic">Aucun message reçu.</td></tr>
                            ) : (
                                messages.map((msg) => (
                                    <tr key={msg.id} className={clsx("hover:bg-bel-gray/50 transition-colors", msg.status === 'unread' ? "bg-bel-accent/5" : "")}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-bel-dark flex items-center">
                                                {msg.status === 'unread' && <div className="w-2 h-2 bg-bel-accent rounded-full mr-2 animate-pulse"></div>}
                                                {msg.name}
                                            </div>
                                            <div className="text-xs text-gray-500">{msg.email}</div>
                                            {msg.phone && (
                                                <div className="text-xs text-green-600 font-medium flex items-center mt-1">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                                    {msg.phone}
                                                </div>
                                            )}
                                            <div className="text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-bel-dark mb-1">{msg.subject || 'Sans objet'}</div>
                                            <div className="text-sm text-gray-600 line-clamp-2 max-w-sm" title={msg.message}>{msg.message}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${msg.status === 'read' ? 'bg-gray-100 text-gray-600' : 'bg-bel-accent text-bel-dark'}`}>
                                                {msg.status === 'read' ? 'Lu' : 'Nouveau'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex justify-end space-x-2">
                                                {msg.status === 'unread' && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(msg.id)}
                                                        className="p-2 text-bel-dark hover:bg-bel-accent/10 rounded-lg transition-colors shadow-sm"
                                                        title="Marquer comme lu"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </motion.div>
            )}
        </div>
    );
}

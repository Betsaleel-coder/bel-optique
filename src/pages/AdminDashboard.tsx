import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, LogIn, LogOut, Package, Calendar, Clock, CheckCircle2, XCircle, TrendingUp, Star, Percent, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
    // Auth state
    const [session, setSession] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Dashboard state
    const [activeTab, setActiveTab] = useState<'products' | 'appointments'>('products');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalAppointments: 0,
        pendingAppointments: 0,
        promoProducts: 0,
        featuredProducts: 0
    });

    // Products state
    const [products, setProducts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        category: 'Solaires',
        price: 0,
        image_url: '',
        is_new: false,
        is_promotion: false,
        is_featured: false,
        description: '',
    });

    // Appointments state
    const [appointments, setAppointments] = useState<any[]>([]);

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
            } else {
                fetchAppointments();
            }
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

    async function fetchAppointments() {
        setLoading(true);
        const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: false });
        if (data) {
            setAppointments(data);
            setStats(prev => ({
                ...prev,
                totalAppointments: data.length,
                pendingAppointments: data.filter(a => a.status === 'pending').length
            }));
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
                price: product.price || 0,
                image_url: product.image_url || '',
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
                price: 0,
                image_url: '',
                is_new: false,
                is_promotion: false,
                is_featured: false,
                description: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase.from('products').update(formData).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('products').insert([formData]);
                if (error) throw error;
            }
            handleCloseModal();
            fetchProducts();
        } catch (err: any) {
            alert(`Erreur: ${err.message}`);
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

    const categories = ['Solaires', 'Médicales', 'Homme', 'Femme', 'Enfants', 'Accessoires'];

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

                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'products' ? 'border-bel-dark text-bel-dark' : 'border-transparent text-gray-500 hover:text-bel-dark hover:border-gray-300'
                                }`}
                        >
                            <Package size={18} className="mr-2" /> Produits
                        </button>
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'appointments' ? 'border-bel-dark text-bel-dark' : 'border-transparent text-gray-500 hover:text-bel-dark hover:border-gray-300'
                                }`}
                        >
                            <Calendar size={18} className="mr-2" /> Rendez-vous
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                <div>
                                    <label className="block text-sm font-medium text-bel-dark/70 mb-2">Image URL</label>
                                    <input
                                        type="text"
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        className="w-full px-4 py-3 bg-bel-gray/30 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none transition-all"
                                    />
                                    {formData.image_url && (
                                        <div className="mt-3 w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-bel-gray">
                                            <img src={formData.image_url} alt="Aperçu" className="w-full h-full object-cover mix-blend-multiply" />
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
        </div>
    );
}

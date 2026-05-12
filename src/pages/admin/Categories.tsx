import { useEffect, useState, useRef } from 'react'
import { categoryApi } from '../../api/client'
import { Plus, Trash2, Edit2, ChevronRight, ChevronDown, Folder, FolderPlus, RefreshCw, Layers, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import * as Types from '../../api/client'

interface CategoryNode extends Types.CategoryTreeNodeDto {
    isExpanded?: boolean;
}

export default function AdminCategories() {
    const [categories, setCategories] = useState<CategoryNode[]>([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null)
    const [formData, setFormData] = useState({
        nameEn: '',
        nameAr: '',
        slug: '',
        parentId: null as number | null
    })
    const fileRef = useRef<HTMLInputElement>(null)

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string
                const json = JSON.parse(text)
                await categoryApi.postbulk(Array.isArray(json) ? json as any : [json] as any)
                toast.success('Categories uploaded successfully')
                loadCategories()
            } catch (err: any) {
                toast.error(err.message || 'Invalid JSON file')
            }
        }
        reader.readAsText(file)
        if (fileRef.current) fileRef.current.value = ''
    }

    const loadCategories = async () => {
        setLoading(true)
        try {
            const res = await categoryApi.gethierarchy()
            const roots = (res.rootCategories || []) as CategoryNode[]
            setCategories(roots)
        } catch (e: any) {
            toast.error(e.message || 'Failed to load categories')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCategories()
    }, [])

    const toggleExpand = (id: number) => {
        const toggle = (nodes: CategoryNode[]): CategoryNode[] => {
            return nodes.map(n => {
                if (n.id === id) return { ...n, isExpanded: !n.isExpanded }
                if (n.children) return { ...n, children: toggle(n.children as CategoryNode[]) }
                return n
            })
        }
        setCategories(toggle(categories))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingCategory) {
                await categoryApi.put(editingCategory.id!, formData as any)
                toast.success('Category updated')
            } else {
                await categoryApi.post(formData as any)
                toast.success('Category created')
            }
            setIsModalOpen(false)
            setEditingCategory(null)
            setFormData({ nameEn: '', nameAr: '', slug: '', parentId: null })
            loadCategories()
        } catch (e: any) {
            toast.error(e.message || 'Error saving category')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? This will delete the category and potentially affect campaigns.')) return
        try {
            await categoryApi.deletesafe(id)
            toast.success('Category deleted')
            loadCategories()
        } catch (e: any) {
            toast.error(e.message || 'Error deleting category')
        }
    }

    const openEdit = (cat: CategoryNode) => {
        setEditingCategory(cat)
        setFormData({
            nameEn: cat.nameEn || '',
            nameAr: cat.nameAr || '',
            slug: cat.slug || '',
            parentId: cat.parentId || null
        })
        setIsModalOpen(true)
    }

    const renderNode = (node: CategoryNode, level = 0) => {
        const hasChildren = node.children && node.children.length > 0
        return (
            <div key={node.id} className="w-full">
                <div className={`flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-all border-b border-gray-100 ${level > 0 ? 'ml-8 border-l-2 border-slate-100' : ''}`}>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => hasChildren && toggleExpand(node.id!)}
                            className={`p-1 rounded-md transition-colors ${hasChildren ? 'hover:bg-slate-200 text-slate-600' : 'text-transparent cursor-default'}`}
                        >
                            {node.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className={`p-2 rounded-lg ${level === 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                            {level === 0 ? <Layers className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">{node.nameEn} <span className="text-gray-300 mx-1">|</span> {node.nameAr}</div>
                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">SLUG: {node.slug} • {node.campaignsCount || 0} Campaigns</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setFormData({ ...formData, parentId: node.id! }); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-all" title="Add Sub-category">
                            <FolderPlus className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(node)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(node.id!)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {node.isExpanded && node.children && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                        {(node.children as CategoryNode[]).map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6 py-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Category Management</h1>
                    <p className="text-gray-500 mt-1">Organize the marketplace hierarchy</p>
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileRef} accept=".json" className="hidden" onChange={handleBulkUpload} />
                    <button 
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <Upload className="w-4 h-4" />
                        Bulk Upload
                    </button>
                    <button 
                        onClick={() => { setEditingCategory(null); setFormData({ nameEn: '', nameAr: '', slug: '', parentId: null }); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-[#1E3A8A] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Root Category
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <RefreshCw className="w-10 h-10 text-[#1E3A8A] animate-spin" />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Hierarchy...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-center px-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <Layers className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No categories found</h3>
                        <p className="text-gray-400 text-sm mt-1 max-w-xs">Start building your platform's catalog by adding your first category.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {categories.map(cat => renderNode(cat))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 pb-0">
                            <h2 className="text-xl font-bold text-slate-900">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                            <p className="text-sm text-gray-400 mt-1">Fill in the details below to save changes.</p>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">English Name</label>
                                <input 
                                    required 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.nameEn}
                                    onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                                    placeholder="e.g. Technology"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Arabic Name</label>
                                <input 
                                    required 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-right"
                                    value={formData.nameAr}
                                    onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                                    placeholder="مثال: التكنولوجيا"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Slug (URL Identifer)</label>
                                <input 
                                    required 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono"
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="technology-and-apps"
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 bg-[#1E3A8A] text-white px-4 py-3 text-sm font-bold rounded-xl hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all active:scale-95">
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

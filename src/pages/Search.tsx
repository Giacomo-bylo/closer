import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, MapPin, Phone, Calendar, ArrowRight, Loader2, Users, X, Search as SearchIcon, Home, Clock } from 'lucide-react';
import { getAllLeads } from '@/services/leadService';
import { LeadSearchResult } from '@/types';
import { formatDate } from '@/lib/utils';

const Search: React.FC = () => {
  const [allLeads, setAllLeads] = useState<LeadSearchResult[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadSearchResult[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const navigate = useNavigate();

  // Filtri
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tutti');
  const [dateFilter, setDateFilter] = useState<string>('tutti');

  // Carica tutti i lead all'avvio
  useEffect(() => {
    loadAllLeads();
  }, []);

  const loadAllLeads = async () => {
    setLoadingAll(true);
    try {
      const data = await getAllLeads();
      setAllLeads(data);
      setFilteredLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAll(false);
    }
  };

  // Applica filtri quando cambiano
  useEffect(() => {
    let result = [...allLeads];

    // Filtro per testo (nome, telefono, indirizzo)
    if (searchText.trim()) {
      const search = searchText.toLowerCase().trim();
      result = result.filter(lead => {
        const name = lead.name?.toLowerCase() || '';
        const phone = lead.phone || '';
        const address = lead.address?.toLowerCase() || '';
        
        return name.includes(search) || phone.includes(search) || address.includes(search);
      });
    }

    // Filtro per stato
    if (statusFilter !== 'tutti') {
      result = result.filter(lead => {
        const callStatus = lead.callStatus?.toLowerCase() || '';
        const closerStatus = lead.closerStatus?.toLowerCase() || '';
        
        if (statusFilter === 'qualificato') return callStatus.includes('qualificato') && !callStatus.includes('non');
        if (statusFilter === 'non_qualificato') return callStatus.includes('non') || callStatus.includes('rifiuta');
        if (statusFilter === 'callback') return callStatus.includes('callback');
        if (statusFilter === 'in_lavorazione') return closerStatus === 'in_lavorazione';
        if (statusFilter === 'approvato') return closerStatus === 'approvato';
        if (statusFilter === 'rifiutato') return closerStatus === 'rifiutato';
        return true;
      });
    }

    // Filtro per data
    if (dateFilter !== 'tutti') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      result = result.filter(lead => {
        if (!lead.lastInteraction) return false;
        
        const leadDate = new Date(lead.lastInteraction);
        
        if (dateFilter === 'oggi') {
          return leadDate >= today;
        }
        if (dateFilter === 'settimana') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return leadDate >= weekAgo;
        }
        if (dateFilter === 'mese') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return leadDate >= monthAgo;
        }
        return true;
      });
    }

    setFilteredLeads(result);
  }, [searchText, statusFilter, dateFilter, allLeads]);

  // Reset filtri
  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('tutti');
    setDateFilter('tutti');
  };

  const hasActiveFilters = searchText || statusFilter !== 'tutti' || dateFilter !== 'tutti';

  // Badge per stato chiamata
  const CallStatusBadge = ({ status }: { status?: string }) => {
    const normalized = status?.toLowerCase() || '';
    let colorClass = 'bg-slate-100 text-slate-500';
    let label = 'N/D';

    if (normalized.includes('qualificato') && !normalized.includes('non')) {
      colorClass = 'bg-emerald-100 text-emerald-700';
      label = 'Qualificato';
    } else if (normalized.includes('non') || normalized.includes('rifiuta')) {
      colorClass = 'bg-red-100 text-red-700';
      label = 'Non qualificato';
    } else if (normalized.includes('callback')) {
      colorClass = 'bg-amber-100 text-amber-700';
      label = 'Callback';
    } else if (normalized.includes('non risponde')) {
      colorClass = 'bg-slate-100 text-slate-600';
      label = 'Non risponde';
    }

    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  // Badge per stato property
  const PropertyStatusBadge = ({ status }: { status?: string }) => {
    const normalized = status?.toLowerCase() || '';
    let colorClass = 'bg-slate-100 text-slate-500';
    let label = 'N/D';

    if (normalized === 'approved' || normalized === 'approvato') {
      colorClass = 'bg-emerald-100 text-emerald-700';
      label = 'Approvato';
    } else if (normalized === 'pending' || normalized === 'in attesa') {
      colorClass = 'bg-amber-100 text-amber-700';
      label = 'Pending';
    }

    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  // Badge per stato closer
  const CloserStatusBadge = ({ status }: { status?: string }) => {
    const normalized = status?.toLowerCase() || 'in_lavorazione';
    let colorClass = 'bg-blue-100 text-blue-700 border border-blue-200';
    let label = 'In lavorazione';

    if (normalized === 'approvato') {
      colorClass = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      label = 'Approvato';
    } else if (normalized === 'rifiutato') {
      colorClass = 'bg-red-100 text-red-700 border border-red-200';
      label = 'Rifiutato';
    }

    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${colorClass}`}>
        {label}
      </span>
    );
  };

  // Componente card per i lead
  const LeadCard = ({ lead }: { lead: LeadSearchResult }) => (
    <div
      onClick={() => navigate(`/lead/${lead.id}`)}
      className="group bg-white rounded-xl px-5 py-4 border border-slate-200 shadow-sm hover:shadow-lg hover:border-bylo-blue/50 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Parte sinistra: Nome + Stati */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Nome */}
          <h3 className="font-semibold text-slate-900 group-hover:text-bylo-blue transition-colors truncate min-w-[140px]">
            {lead.name || 'Nome sconosciuto'}
          </h3>
          
          {/* Stato Chiamata */}
          <div className="flex items-center gap-1.5">
            <Phone size={14} className="text-slate-400" />
            <CallStatusBadge status={lead.callStatus} />
          </div>
          
          {/* Stato Immobile */}
          <div className="flex items-center gap-1.5">
            <Home size={14} className="text-slate-400" />
            <PropertyStatusBadge status={lead.propertyStatus} />
          </div>
        </div>
        
        {/* Parte centrale: Info aggiuntive */}
        <div className="hidden lg:flex items-center gap-4 text-sm text-slate-500">
          {lead.phone && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{lead.phone}</span>
            </div>
          )}
          {lead.address && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-slate-400" />
              <span className="truncate max-w-[180px]">{lead.address}</span>
            </div>
          )}
          {lead.lastInteraction && (
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" />
              <span>{formatDate(lead.lastInteraction)}</span>
            </div>
          )}
        </div>

        {/* Parte destra: Stato Closer + Freccia */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <CloserStatusBadge status={lead.closerStatus} />
          <ArrowRight size={18} className="text-slate-300 group-hover:text-bylo-blue transition-colors" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestione Lead</h1>
        <p className="text-slate-500">
          Visualizza e filtra i lead con le informazioni di Chiara e le valutazioni immobiliari.
        </p>
      </div>

      {/* Barra Filtri Curata */}
      <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-bylo-blue/10 rounded-lg">
              <Filter size={18} className="text-bylo-blue" />
            </div>
            <span className="font-semibold text-slate-800">Filtri di ricerca</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-slate-500 hover:text-bylo-blue flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={14} />
              Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Ricerca testuale */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Cerca</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Nome, telefono, indirizzo..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bylo-blue/20 focus:border-bylo-blue transition-all"
              />
            </div>
          </div>

          {/* Filtro stato */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Stato</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-bylo-blue/20 focus:border-bylo-blue transition-all appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="tutti">Tutti gli stati</option>
              <optgroup label="Stato Chiamata">
                <option value="qualificato">✓ Qualificato</option>
                <option value="non_qualificato">✗ Non qualificato</option>
                <option value="callback">↻ Callback</option>
              </optgroup>
              <optgroup label="Stato Closer">
                <option value="in_lavorazione">⏳ In lavorazione</option>
                <option value="approvato">✓ Approvato</option>
                <option value="rifiutato">✗ Rifiutato</option>
              </optgroup>
            </select>
          </div>

          {/* Filtro data */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Periodo</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-bylo-blue/20 focus:border-bylo-blue transition-all appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="tutti">Qualsiasi data</option>
              <option value="oggi">Oggi</option>
              <option value="settimana">Ultima settimana</option>
              <option value="mese">Ultimo mese</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista Lead */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-700">Lead</h2>
          <span className="text-sm text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {filteredLeads.length}{hasActiveFilters ? ` di ${allLeads.length}` : ''}
          </span>
        </div>

        {loadingAll ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-bylo-blue" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-500">
              {hasActiveFilters 
                ? 'Nessun lead corrisponde ai filtri selezionati' 
                : 'Nessun lead presente'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 text-bylo-blue hover:underline text-sm"
              >
                Reset filtri
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
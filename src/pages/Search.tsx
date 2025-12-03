import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, MapPin, Phone, Calendar, ArrowRight, Loader2, Users, X, Search as SearchIcon } from 'lucide-react';
import { getAllLeads } from '@/services/leadService';
import { LeadSearchResult } from '@/types';
import Badge from '@/components/Badge';
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
      result = result.filter(lead => 
        lead.name.toLowerCase().includes(search) ||
        lead.phone.includes(search) ||
        (lead.address && lead.address.toLowerCase().includes(search))
      );
    }

    // Filtro per stato
    if (statusFilter !== 'tutti') {
      result = result.filter(lead => {
        const status = lead.status?.toLowerCase() || '';
        if (statusFilter === 'qualificato') return status.includes('qualificato') && !status.includes('non');
        if (statusFilter === 'non_qualificato') return status.includes('non') || status.includes('rifiuta');
        if (statusFilter === 'callback') return status.includes('callback');
        if (statusFilter === 'approvato') return status === 'approvato' || status === 'approved';
        if (statusFilter === 'in_attesa') return status === 'in attesa' || status === 'pending';
        return true;
      });
    }

    // Filtro per data
    if (dateFilter !== 'tutti') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      result = result.filter(lead => {
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

  // Componente card compatta per i lead
  const LeadCard = ({ lead }: { lead: LeadSearchResult }) => (
    <div
      onClick={() => navigate(`/lead/${lead.id}`)}
      className="group bg-white rounded-lg px-4 py-3 border border-slate-200 shadow-sm hover:shadow-md hover:border-bylo-blue transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 group-hover:text-bylo-blue transition-colors truncate">
            {lead.name}
          </h3>
          {lead.status && <Badge status={lead.status} />}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-slate-500 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            <Phone size={13} />
            <span>{lead.phone}</span>
          </div>
          {lead.address && (
            <div className="hidden md:flex items-center gap-1.5">
              <MapPin size={13} />
              <span className="truncate max-w-[150px]">{lead.address}</span>
            </div>
          )}
          <div className="hidden lg:flex items-center gap-1.5">
            <Calendar size={13} />
            <span>{formatDate(lead.lastInteraction)}</span>
          </div>
          
          <div className="flex gap-1">
            {lead.hasCall && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-medium">Chiamata</span>}
            {lead.hasProperty && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-medium">Immobile</span>}
          </div>
          
          <ArrowRight size={16} className="text-slate-300 group-hover:text-bylo-blue" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestione Lead</h1>
        <p className="text-slate-500">
          Visualizza e filtra i lead con le informazioni di Chiara e le valutazioni immobiliari.
        </p>
      </div>

      {/* Barra Filtri */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-500" />
          <span className="font-medium text-slate-700">Filtri</span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-xs text-bylo-blue hover:underline flex items-center gap-1"
            >
              <X size={12} />
              Reset filtri
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Ricerca testuale */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Nome, telefono, indirizzo..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bylo-blue focus:border-transparent"
            />
          </div>

          {/* Filtro stato */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-bylo-blue focus:border-transparent"
          >
            <option value="tutti">Tutti gli stati</option>
            <option value="qualificato">Qualificato</option>
            <option value="non_qualificato">Non qualificato</option>
            <option value="callback">Callback richiesto</option>
            <option value="approvato">Approvato</option>
            <option value="in_attesa">In attesa</option>
          </select>

          {/* Filtro data */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-bylo-blue focus:border-transparent"
          >
            <option value="tutti">Qualsiasi data</option>
            <option value="oggi">Oggi</option>
            <option value="settimana">Ultima settimana</option>
            <option value="mese">Ultimo mese</option>
          </select>
        </div>
      </div>

      {/* Lista Lead */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-700">Lead</h2>
          <span className="text-sm text-slate-400">
            ({filteredLeads.length}{hasActiveFilters ? ` di ${allLeads.length}` : ''})
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
          <div className="space-y-2">
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
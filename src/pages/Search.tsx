import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Phone, Calendar, ArrowRight, Loader2, Users } from 'lucide-react';
import { searchLeads, getAllLeads } from '@/services/leadService';
import { LeadSearchResult } from '@/types';
import Badge from '@/components/Badge';
import { formatDate } from '@/lib/utils';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [allLeads, setAllLeads] = useState<LeadSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  // Carica tutti i lead all'avvio
  useEffect(() => {
    const loadAllLeads = async () => {
      try {
        const data = await getAllLeads();
        setAllLeads(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAll(false);
      }
    };
    loadAllLeads();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchLeads(query);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Resetta la ricerca quando si cancella il testo
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setHasSearched(false);
      setResults([]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Cerca un Lead</h1>
        <p className="text-slate-500">
          Inserisci nome, telefono o indirizzo per trovare le informazioni di Chiara e le valutazioni immobiliari.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-12">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-28 py-4 bg-white border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bylo-blue focus:border-transparent text-lg transition-shadow"
            placeholder="Es. Mario Rossi, +39 333..., Via Roma 10"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-bylo-blue text-white px-6 rounded-lg font-medium hover:bg-bylo-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Cerca'}
          </button>
        </div>
        <div className="mt-2 text-xs text-center text-slate-400">
          Cerca attraverso entrambi i database (Trillo & Conto Economico)
        </div>
      </form>

      {/* Search Results */}
      <div className="space-y-4">
        {hasSearched && results.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-500">Nessun risultato trovato per "{query}"</p>
          </div>
        )}

        {results.map((lead) => (
          <div
            key={lead.id}
            onClick={() => navigate(`/lead/${lead.id}`)}
            className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-bylo-blue transition-all cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-bylo-blue transition-colors">
                    {lead.name}
                  </h3>
                  {lead.status && <Badge status={lead.status} />}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-slate-500 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} />
                    <span>{lead.phone}</span>
                  </div>
                  {lead.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      <span className="truncate max-w-[200px]">{lead.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{formatDate(lead.lastInteraction)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {lead.hasCall && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded font-medium">Chiamata</span>}
                  {lead.hasProperty && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded font-medium">Immobile</span>}
                </div>
                <ArrowRight className="text-slate-300 group-hover:text-bylo-blue ml-2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* All Leads List (when not searching) */}
      {!hasSearched && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-700">Tutti i Lead</h2>
            <span className="text-sm text-slate-400">({allLeads.length})</span>
          </div>

          {loadingAll ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-bylo-blue" />
            </div>
          ) : allLeads.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <p className="text-slate-500">Nessun lead presente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/lead/${lead.id}`)}
                  className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-bylo-blue transition-all cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-bylo-blue transition-colors">
                          {lead.name}
                        </h3>
                        {lead.status && <Badge status={lead.status} />}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-slate-500 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.address && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} />
                            <span className="truncate max-w-[200px]">{lead.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span>{formatDate(lead.lastInteraction)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {lead.hasCall && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded font-medium">Chiamata</span>}
                        {lead.hasProperty && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded font-medium">Immobile</span>}
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-bylo-blue ml-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
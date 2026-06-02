import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, Users, Wallet, FolderKanban, FileDown, ChevronRight, Info } from 'lucide-react';
import { format } from 'date-fns';

export default function Programmes() {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProgramme, setSelectedProgramme] = useState(null);

  const { data: programmes = [], isLoading } = useQuery({
    queryKey: ['programmes'],
    queryFn: () => base44.entities.Programme.list('-created_date', 100),
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['all-applications'],
    queryFn: () => base44.entities.Application.list('-created_date', 500),
  });

  const filtered = programmes.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getProgrammeStats = (programmeId) => {
    const progApps = applications.filter(a => a.programme_id === programmeId);
    const approved = progApps.filter(a => a.status === 'approved').length;
    const total = progApps.length;
    return {
      total,
      approved,
      acceptanceRate: total > 0 ? ((approved / total) * 100).toFixed(1) : '0',
      underReview: progApps.filter(a => a.status === 'under_review').length,
    };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programmes"
        description="Browse and manage all programmes"
        actions={
          user?.role === 'admin' && (
            <Link to="/programmes/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" /> New Programme
              </Button>
            </Link>
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search programmes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="application">Open</SelectItem>
            <SelectItem value="selection">Selection</SelectItem>
            <SelectItem value="implementation">Active</SelectItem>
            <SelectItem value="completion">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="p-5 h-48" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No programmes found" description="Create your first programme to get started" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(prog => {
            const stats = getProgrammeStats(prog.id);
            return (
              <Card key={prog.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <Link to={`/programmes/${prog.id}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
                        {prog.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{prog.category}</p>
                    </div>
                    <StatusBadge status={prog.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {prog.start_date ? format(new Date(prog.start_date), 'MMM d, yyyy') : 'TBD'}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {prog.max_participants || 0} max
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5" />
                      ${((prog.total_budget || 0) / 1000).toFixed(0)}k budget
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileDown className="h-3.5 w-3.5" />
                      {stats.total} applications
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/programmes/${prog.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProgramme(prog)}>
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selectedProgramme} onOpenChange={() => setSelectedProgramme(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedProgramme && (
            <ScrollArea className="h-full pr-4">
              <SheetHeader className="mb-6">
                <SheetTitle>{selectedProgramme.name}</SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Application Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Submissions', value: getProgrammeStats(selectedProgramme.id).total },
                      { label: 'Acceptance Rate', value: `${getProgrammeStats(selectedProgramme.id).acceptanceRate}%` },
                      { label: 'Approved', value: getProgrammeStats(selectedProgramme.id).approved },
                      { label: 'Under Review', value: getProgrammeStats(selectedProgramme.id).underReview },
                    ].map(stat => (
                      <div key={stat.label} className="bg-muted rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-lg font-bold mt-0.5">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-3">Eligibility Criteria</h3>
                  {selectedProgramme.eligibility_criteria?.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedProgramme.eligibility_criteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No criteria defined</p>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-3">Documents</h3>
                  {selectedProgramme.documents?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProgramme.documents.map((doc, i) => (
                        <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-muted transition-colors">
                          <FileDown className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">{doc.name}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents available</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
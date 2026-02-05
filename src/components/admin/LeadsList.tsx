import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeads } from '@/store/leadsSlice';
import { RootState } from '@/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Search,
  Eye,
  Mail,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendLeadEmailAPI } from '@/api';

export const LeadsList = () => {
  const dispatch = useDispatch();
  const leads = useSelector((state: RootState) => state.leads.list);

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLead, setSelectedLead] = useState<typeof leads[0] | null>(null);
  const { toast } = useToast();

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewLead = (leadId: string) => {
    const lead = leads.find((l: { _id: string }) => l._id === leadId);
    setSelectedLead(lead ?? null);
  };

  const handleEmailLead = async (leadId: string) => {
    const lead = leads.find((l: { _id: string }) => l._id === leadId);
    try {
      await sendLeadEmailAPI(leadId, {});
      toast({
        title: "Email sent",
        description: `Follow-up email sent to ${lead?.firstName ?? ''} ${lead?.lastName ?? ''} (${lead?.email}).`,
      });
    } catch (error: unknown) {
      console.error('Failed to send email:', error);
      const message = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : null;
      toast({
        title: "Email failed",
        description: message || "Unable to send email. Check SMTP settings and try again.",
        variant: "destructive",
      });
    }
  };

  const exportLeads = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Email,Phone,Assessment,Score,Status,Date\n" +
      filteredLeads.map(lead => 
        `"${lead.firstName} ${lead.lastName}","${lead.email}","${lead.phone || ''}","${lead.assessment?.title || '—'}","${lead.score}","${lead.status}","${lead.completedAt || ''}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "voiceflow-leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "Leads data has been exported to CSV.",
    });
  };

  return (
    <div className="space-y-6">
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-md sm:max-w-lg border-2 border-gray-400">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg -m-6 mb-4">
            <DialogTitle className="text-white font-bold">Lead details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <span className="text-gray-600 font-semibold">Name</span>
                <span className="font-bold text-gray-900">{selectedLead.firstName} {selectedLead.lastName}</span>
                <span className="text-gray-600 font-semibold">Email</span>
                <span className="font-bold text-gray-900">{selectedLead.email}</span>
                <span className="text-gray-600 font-semibold">Phone</span>
                <span className="text-gray-800">{selectedLead.phone || '—'}</span>
                <span className="text-gray-600 font-semibold">Age range</span>
                <span className="text-gray-800">{selectedLead.ageRange || '—'}</span>
                <span className="text-gray-600 font-semibold">Gender</span>
                <span className="text-gray-800">{selectedLead.gender || '—'}</span>
                <span className="text-gray-600 font-semibold">Source</span>
                <span className="text-gray-800">{selectedLead.source || '—'}</span>
                <span className="text-gray-600 font-semibold">Assessment</span>
                <span className="font-bold text-gray-900">{selectedLead.assessment?.title ?? '—'}</span>
                <span className="text-gray-600 font-semibold">Score</span>
                <span>
                  <Badge variant={selectedLead.score >= 80 ? 'default' : selectedLead.score >= 60 ? 'secondary' : 'outline'} className="font-bold">
                    {selectedLead.score} / 100
                  </Badge>
                </span>
                <span className="text-gray-600 font-semibold">Status</span>
                <span>
                  <Badge variant={
                    selectedLead.status === 'converted' ? 'default' :
                    selectedLead.status === 'qualified' ? 'secondary' :
                    selectedLead.status === 'contacted' ? 'outline' : 'outline'
                  } className="font-semibold">
                    {selectedLead.status}
                  </Badge>
                </span>
                <span className="text-gray-600 font-semibold">Completed</span>
                <span className="text-gray-800">{selectedLead.completedAt ? new Date(selectedLead.completedAt).toLocaleString() : '—'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">Lead Intelligence</h3>
        <Button onClick={exportLeads} variant="outline" className="border-2 border-gray-400 hover:border-green-600 hover:bg-green-50 font-semibold shadow-md">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="p-6 border-2 border-gray-300 shadow-lg bg-white">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 border-gray-300 focus:border-blue-500"
            />
          </div>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 font-semibold text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-100 to-gray-200">
                <TableHead className="font-bold text-gray-900">Name</TableHead>
                <TableHead className="font-bold text-gray-900">Contact</TableHead>
                <TableHead className="font-bold text-gray-900">Assessment</TableHead>
                <TableHead className="font-bold text-gray-900">Score</TableHead>
                <TableHead className="font-bold text-gray-900">Status</TableHead>
                <TableHead className="font-bold text-gray-900">Date</TableHead>
                <TableHead className="font-bold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map(lead => (
                <TableRow key={lead._id} className="hover:bg-blue-50 border-b-2 border-gray-200">
                  <TableCell>
                    <div>
                      <div className="font-bold text-gray-900">{lead.firstName} {lead.lastName}</div>
                      <div className="text-sm text-gray-600 font-medium">{lead.ageRange}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-800">{lead.email}</div>
                      {lead.phone && (
                        <div className="text-sm text-gray-600">{lead.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-bold text-gray-900">{lead.assessment?.title ?? '—'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lead.score >= 80 ? 'default' : lead.score >= 60 ? 'secondary' : 'outline'} className="font-bold">
                      {lead.score} / 100
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      lead.status === 'converted' ? 'default' :
                      lead.status === 'qualified' ? 'secondary' :
                      lead.status === 'contacted' ? 'outline' : 'outline'
                    } className="font-semibold">
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-gray-700">{lead.completedAt ? lead.completedAt.slice(0, 10) : '—'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewLead(lead._id)}
                        title="View Details"
                        className="hover:bg-blue-100 text-blue-700 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmailLead(lead._id)}
                        title="Send Email"
                        className="hover:bg-green-100 text-green-700 hover:text-green-900"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-700 font-semibold">No leads found matching your criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

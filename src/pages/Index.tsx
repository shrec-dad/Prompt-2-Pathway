import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users as UsersIcon, BarChart3, Settings as SettingsIcon, Mic, LogOut } from 'lucide-react';
import { Users } from '@/components/admin/Users';
import { AssessmentsList } from '@/components/admin/AssessmentsList';
import { LeadsList } from '@/components/admin/LeadsList';
import { VoiceSettings } from '@/components/admin/VoiceSettings';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { Settings } from '@/components/admin/Settings';

const tabs = [
  { key: "assessments", label: "Assessments", icon: SettingsIcon },
  { key: "leads", label: "Leads", icon: Mic },
  { key: "analytics", label: "Analytics", icon: UsersIcon },
  { key: "voice_settings", label: "Voice Settings", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

const Index = () => {
  const navigate = useNavigate();
  const userRoles = localStorage.getItem("roles");

  const handleLogout = () => {
    localStorage.removeItem('token'); // clear JWT
    localStorage.removeItem("roles");
    navigate('/login'); // redirect to login
  };

  const allowedTabs: string[] = JSON.parse(localStorage.getItem("allowedTabs") || "[]");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 drop-shadow-sm">Welcome to Prompt 2 Pathway</h1>
            <p className="text-xl text-gray-700 mb-8 font-medium">
              Discover your path through personalized voice-guided assessments
            </p>
          </div>
          <Button onClick={handleLogout} className="flex items-center bg-red-600 hover:bg-red-700 text-white shadow-md">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
				  </Button>
        </div>

        <Tabs defaultValue="assessments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            {userRoles.includes("platform_admin") && (
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <UsersIcon className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
            )}
            {tabs
              .filter((tab) => allowedTabs.includes(tab.key))
              .map(({ key, label, icon: Icon }) => (
                <TabsTrigger key={key} value={key} className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
          </TabsList>

          {userRoles.includes("platform_admin") && (
            <TabsContent value="users" className="space-y-6">
              <Users />
            </TabsContent>
          )}

          <TabsContent value="assessments" className="space-y-6">
            <AssessmentsList />
          </TabsContent>

          <TabsContent value="voice_settings" className="space-y-6">
            <VoiceSettings />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsList />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

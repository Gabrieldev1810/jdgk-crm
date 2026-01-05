import React, { useState } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { tasksService, CreateTaskDto } from '@/services/tasks.service';
import { campaignsService, Campaign } from '@/services/campaigns.service';
import { useToast } from '@/components/ui/use-toast';

export const TasksPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newTask, setNewTask] = useState<CreateTaskDto>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    campaignId: undefined
  });
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(undefined);
  const [newCampaign, setNewCampaign] = useState({ name: '', color: '#3b82f6' });
  const { toast } = useToast();

  React.useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await campaignsService.getAll();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns', error);
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const customColumns = selectedCampaign?.columns;

  const handleCreateCampaign = async () => {
    try {
      await campaignsService.create(newCampaign);
      setIsCreateCampaignOpen(false);
      setNewCampaign({ name: '', color: '#3b82f6' });
      loadCampaigns();
      toast({ title: 'Success', description: 'Campaign created successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTask = async () => {
    try {
      await tasksService.create(newTask);
      setIsCreateOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', status: 'TODO' });
      // We need to refresh the board. 
      // Ideally, we would lift the state up or use a context/query library like React Query.
      // For now, I'll just force a reload or rely on the user refreshing.
      // Actually, let's just reload the page for simplicity in this step, 
      // or better, pass a refresh trigger to KanbanBoard.
      window.location.reload(); 
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            Manage your tasks and projects using the Kanban board.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select 
            value={selectedCampaignId} 
            onValueChange={(value) => setSelectedCampaignId(value === "ALL" ? undefined : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Tasks</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: campaign.color }} />
                    {campaign.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
                <DialogDescription>Add a new campaign to organize tasks.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="camp-name" className="text-right">Name</Label>
                  <Input
                    id="camp-name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="camp-color" className="text-right">Color</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="camp-color"
                      type="color"
                      value={newCampaign.color}
                      onChange={(e) => setNewCampaign({ ...newCampaign, color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <span className="text-sm text-muted-foreground">{newCampaign.color}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateCampaign}>Create Campaign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>
                Add a new task to your board.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="campaign" className="text-right">
                  Campaign
                </Label>
                <Select 
                    value={newTask.campaignId} 
                    onValueChange={(value) => setNewTask({ ...newTask, campaignId: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select campaign (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: campaign.color }} />
                          {campaign.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select 
                    value={newTask.priority} 
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateTask}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard campaignId={selectedCampaignId} customColumns={customColumns} />
      </div>
    </div>
  );
};

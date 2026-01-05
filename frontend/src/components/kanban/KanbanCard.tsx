import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { Task } from '@/services/tasks.service';
import { auth, vicidialService } from '@/services';

interface KanbanCardProps {
  task: Task;
  index: number;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-blue-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-red-500',
  URGENT: 'bg-red-700',
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, index }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
        >
          <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium leading-none">
                  {task.title}
                </CardTitle>
                {task.priority && (
                  <Badge className={`${priorityColors[task.priority] || 'bg-gray-500'} text-white text-[10px] px-1 py-0`}>
                    {task.priority}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {task.description}
              </p>
              
              {task.vicidialCallbackId && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <Badge variant="outline" className="text-[10px]">Callback</Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 rounded-full hover:bg-green-100 hover:text-green-600"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!task.vicidialLeadId) return;

                      try {
                        const currentUser = await auth.getCurrentUser();
                        if (!currentUser) {
                          alert('User not authenticated');
                          return;
                        }

                        // Fetch lead to get phone number
                        const lead = await vicidialService.getLead(task.vicidialLeadId);
                        if (!lead || !lead.phone_number) {
                          alert('Could not find phone number for this lead');
                          return;
                        }

                        await vicidialService.dial(lead.phone_number, currentUser.email, task.vicidialLeadId.toString());
                        alert(`Calling ${lead.phone_number}...`);
                      } catch (error: any) {
                        console.error('Failed to call:', error);
                        alert(`Failed to call: ${error.message || 'Unknown error'}`);
                      }
                    }}
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {task.campaign && (
                <div className="flex items-center mt-2">
                  <div 
                    className="w-2 h-2 rounded-full mr-1.5" 
                    style={{ backgroundColor: task.campaign.color }}
                  />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {task.campaign.name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

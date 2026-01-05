import React, { useEffect, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, tasksService } from '@/services/tasks.service';
import { KanbanColumn } from './KanbanColumn';
import { useToast } from '@/components/ui/use-toast';
import { KanbanColumn as IKanbanColumn } from '@/services/campaigns.service';

interface KanbanBoardProps {
  campaignId?: string;
  customColumns?: IKanbanColumn[];
}

const DEFAULT_COLUMNS = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ campaignId, customColumns }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, [campaignId]); // Reload when campaign changes

  const loadTasks = async () => {
    try {
      const data = await tasksService.getAll();
      // Filter by campaign if selected
      const filteredData = campaignId 
        ? data.filter(t => t.campaignId === campaignId)
        : data.filter(t => !t.campaignId); // Show tasks with no campaign if no campaign selected (or show all? User wants specific campaign view)
      
      // Sort by position
      const sortedData = filteredData.sort((a, b) => a.position - b.position);
      setTasks(sortedData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newTasks = Array.from(tasks);
    const movedTask = newTasks.find((t) => t.id === draggableId);

    if (!movedTask) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;
    
    // Determine if we are using custom columns (IDs) or default status strings
    const isCustom = !!customColumns && customColumns.length > 0;

    // Helper to check if a task belongs to a column/status
    const taskInColumn = (t: Task, colId: string) => {
        return isCustom ? t.columnId === colId : t.status === colId;
    };

    // Get tasks in source column
    const sourceTasks = newTasks.filter(t => taskInColumn(t, sourceId)).sort((a, b) => a.position - b.position);
    
    let destTasks = sourceId === destId 
      ? sourceTasks 
      : newTasks.filter(t => taskInColumn(t, destId)).sort((a, b) => a.position - b.position);

    // Remove from source
    sourceTasks.splice(source.index, 1);
    
    // Update task
    if (isCustom) {
        movedTask.columnId = destId;
    } else {
        movedTask.status = destId;
    }
    
    // Add to destination
    if (sourceId === destId) {
        sourceTasks.splice(destination.index, 0, movedTask);
        sourceTasks.forEach((t, index) => { t.position = index; });
    } else {
        destTasks.splice(destination.index, 0, movedTask);
        sourceTasks.forEach((t, index) => { t.position = index; });
        destTasks.forEach((t, index) => { t.position = index; });
    }

    setTasks([...newTasks]);

    const updates = [
        ...sourceTasks.map(t => ({ id: t.id, position: t.position, status: t.status, columnId: t.columnId })),
        ...(sourceId !== destId ? destTasks.map(t => ({ id: t.id, position: t.position, status: t.status, columnId: t.columnId })) : [])
    ];

    try {
      await tasksService.updatePositions(updates);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task position',
        variant: 'destructive',
      });
      loadTasks();
    }
  };

  const getTasksByColumn = (colId: string) => {
    return tasks
      .filter((task) => (customColumns && customColumns.length > 0) ? task.columnId === colId : task.status === colId)
      .sort((a, b) => a.position - b.position);
  };

  const columnsToRender = (customColumns && customColumns.length > 0) 
    ? customColumns.map(c => ({ id: c.id, title: c.title })) 
    : DEFAULT_COLUMNS;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full overflow-x-auto pb-4">
        {columnsToRender.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={getTasksByColumn(column.id)}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

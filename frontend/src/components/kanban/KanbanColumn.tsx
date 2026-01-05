import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task } from '@/services/tasks.service';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks }) => {
  return (
    <div className="flex flex-col w-80 bg-muted/50 rounded-lg p-4 mr-4 h-full">
      <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground">
        {title} <span className="ml-2 bg-muted text-foreground px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>
      </h3>
      <Droppable droppableId={id}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex-1 min-h-[100px]"
          >
            {tasks.map((task, index) => (
              <KanbanCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

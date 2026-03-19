import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, GripVertical, Pencil, Check, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  id: string;
  content: string;
  isCompleted: boolean;
  dueDate: string | null;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
}

export function TaskItem({ id, content, isCompleted, dueDate, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== content) {
      onEdit(id, trimmed);
    } else {
      setEditValue(content);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditValue(content); setIsEditing(false); }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
        isDragging && "opacity-50 shadow-lg z-50",
        isCompleted && "bg-muted/30"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Checkbox
        checked={isCompleted}
        onCheckedChange={(checked) => onToggle(id, !!checked)}
        className={isCompleted ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary" : ""}
      />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="h-8"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onMouseDown={(e) => { e.preventDefault(); handleSave(); }}>
              <Check className="w-4 h-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onMouseDown={(e) => { e.preventDefault(); setEditValue(content); setIsEditing(false); }}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <div className="cursor-pointer" onDoubleClick={() => !isCompleted && setIsEditing(true)}>
            <p className={cn("truncate", isCompleted && "line-through text-muted-foreground")}>{content}</p>
            {dueDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <CalendarIcon className="w-3 h-3" />
                {format(new Date(dueDate), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        )}
      </div>
      {!isEditing && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => { setIsEditing(true); }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}

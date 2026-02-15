import { useState } from 'react';
import { DataVersion } from '@/hooks/useDataVersions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, Trash2, Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VersionHistoryProps {
  versions: DataVersion[];
  isLoading: boolean;
  onSave: (summary?: string) => void;
  onRestore: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  hasData: boolean;
}

export function VersionHistory({ versions, isLoading, onSave, onRestore, onDelete, hasData }: VersionHistoryProps) {
  const [summary, setSummary] = useState('');

  const handleSave = () => {
    onSave(summary || undefined);
    setSummary('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5" />
          Version History
        </CardTitle>
        <CardDescription>Save snapshots and rollback to previous versions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save new version */}
        {hasData && (
          <div className="flex gap-2">
            <Input
              placeholder="Change summary (optional)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSave} size="sm" className="shrink-0">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        )}

        {/* Version list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading…
          </div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No versions saved yet</p>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="space-y-2 pr-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs shrink-0">
                        v{v.version_number}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {v.change_summary && (
                      <p className="text-sm truncate">{v.change_summary}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {v.row_count} rows · {v.column_count} cols
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRestore(v.id)}
                      title="Restore this version"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete this version"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete version {v.version_number}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The saved snapshot will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(v.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

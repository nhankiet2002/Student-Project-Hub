import { useRef, useState } from "react";
import {
  useListTaskAttachments,
  useUploadTaskAttachment,
  useDeleteTaskAttachment,
  getListTaskAttachmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
  Upload,
  Download,
  Trash2,
  Paperclip,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import type { TaskAttachment } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const cls = "h-8 w-8 shrink-0";
  if (mimeType.startsWith("image/")) return <FileImage className={`${cls} text-emerald-500`} />;
  if (mimeType === "application/pdf") return <FileText className={`${cls} text-red-500`} />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv") || mimeType.includes("excel"))
    return <FileSpreadsheet className={`${cls} text-green-600`} />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar"))
    return <FileArchive className={`${cls} text-yellow-600`} />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className={`${cls} text-blue-600`} />;
  return <File className={`${cls} text-muted-foreground`} />;
}

function downloadAttachment(taskId: string, attachment: TaskAttachment) {
  const url = `${BASE}api/tasks/${taskId}/attachments/${attachment.id}/download`;
  const a = document.createElement("a");
  a.href = url;
  a.download = attachment.filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  taskDescription?: string | null;
  assigneeName?: string;
}

const statusLabels: Record<string, string> = {
  todo: "Cần làm",
  in_progress: "Đang làm",
  review: "Review",
  done: "Hoàn thành",
};
const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  todo: "secondary",
  in_progress: "default",
  review: "outline",
  done: "default",
};

export function TaskAttachmentDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  taskStatus,
  taskDescription,
  assigneeName,
}: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: attachments, isLoading } = useListTaskAttachments(taskId, {
    query: {
      queryKey: getListTaskAttachmentsQueryKey(taskId),
      enabled: open && !!taskId,
    },
  });

  const uploadMutation = useUploadTaskAttachment({
    mutation: {
      onSuccess: (att) => {
        queryClient.invalidateQueries({ queryKey: getListTaskAttachmentsQueryKey(taskId) });
        toast.success(`Đã tải lên: ${att.filename}`);
      },
      onError: () => toast.error("Tải lên thất bại"),
    },
  });

  const deleteMutation = useDeleteTaskAttachment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTaskAttachmentsQueryKey(taskId) });
        setDeletingId(null);
        toast.success("Đã xoá tệp đính kèm");
      },
      onError: () => { setDeletingId(null); toast.error("Xoá thất bại"); },
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: vượt giới hạn 20 MB`);
        return;
      }
      uploadMutation.mutate({ taskId, data: { file } });
    });
  };

  const handleDelete = (attachment: TaskAttachment) => {
    setDeletingId(attachment.id);
    deleteMutation.mutate({ taskId, attachmentId: attachment.id });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg leading-tight pr-4">{taskTitle}</DialogTitle>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={statusVariants[taskStatus] ?? "secondary"}>
              {statusLabels[taskStatus] ?? taskStatus}
            </Badge>
            {assigneeName && (
              <span className="text-xs text-muted-foreground">{assigneeName}</span>
            )}
          </div>
          {taskDescription && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{taskDescription}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2 space-y-4 pr-1">
          {/* Attachment list */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">
                Tệp đính kèm {attachments ? `(${attachments.length})` : ""}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : !attachments?.length ? (
              <div className="rounded-lg border border-dashed py-8 text-center">
                <Paperclip className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có tệp đính kèm nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/30 transition-colors group"
                  >
                    <FileTypeIcon mimeType={att.mimeType} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight truncate" title={att.filename}>
                        {att.filename}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatBytes(att.size)} &bull; {att.uploadedBy} &bull;{" "}
                        {formatDistanceToNow(new Date(att.uploadedAt), { locale: vi, addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Tải xuống"
                        onClick={() => downloadAttachment(taskId, att)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Xoá"
                        disabled={deletingId === att.id}
                        onClick={() => handleDelete(att)}
                      >
                        {deletingId === att.id ? (
                          <X className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload zone */}
          <div>
            <p className="text-sm font-semibold mb-2">Thêm tệp đính kèm</p>
            <div
              className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                dragging ? "border-violet-500 bg-violet-50" : "border-border hover:border-violet-400 hover:bg-accent/20"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                {uploadMutation.isPending ? "Đang tải lên..." : "Kéo thả hoặc nhấn để chọn tệp"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Word, ảnh, CSV, v.v. — tối đa 20 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {uploadMutation.isPending && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                Đang tải lên...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

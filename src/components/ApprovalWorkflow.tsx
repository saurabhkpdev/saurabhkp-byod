import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApprovalStore, ApprovalRequest, ApprovalStatus } from "@/hooks/useApprovalStore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Check, X, Clock, FileUp, Edit3, Eye, Trash2, AlertCircle } from "lucide-react";

const statusConfig: Record<ApprovalStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: Check },
  rejected: { label: "Rejected", variant: "destructive", icon: X },
};

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  data_upload: { label: "Data Upload", icon: FileUp },
  data_manipulation: { label: "Data Manipulation", icon: Edit3 },
};

const ApprovalWorkflow = () => {
  const { requests, approveRequest, rejectRequest, deleteRequest, clearAllRequests } = useApprovalStore();
  const { currentUser } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  const handleApprove = (id: string) => {
    if (!currentUser) return;
    
    const success = approveRequest(id, currentUser.username);
    if (success) {
      toast.success("Request approved", {
        description: "The changes will be committed to the database.",
      });
    }
  };

  const handleReject = () => {
    if (!currentUser || !rejectingRequestId) return;
    
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    const success = rejectRequest(rejectingRequestId, currentUser.username, rejectReason);
    if (success) {
      toast.success("Request rejected", {
        description: "The submitter will be notified.",
      });
      setIsRejectDialogOpen(false);
      setRejectReason("");
      setRejectingRequestId(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectingRequestId(id);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteRequest(id);
    toast.success("Request deleted");
  };

  const renderRequestRow = (request: ApprovalRequest, showActions: boolean = true) => {
    const StatusIcon = statusConfig[request.status].icon;
    const TypeIcon = typeConfig[request.type]?.icon || FileUp;

    return (
      <TableRow key={request.id}>
        <TableCell>
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{typeConfig[request.type]?.label || request.type}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium truncate max-w-[200px]">{request.fileName}</span>
            <span className="text-xs text-muted-foreground">
              {request.rowCount} rows • {request.columnCount} columns
            </span>
          </div>
        </TableCell>
        <TableCell>{request.submittedBy}</TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="text-sm">{format(new Date(request.submittedAt), "MMM d, HH:mm")}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(request.submittedAt), { addSuffix: true })}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={statusConfig[request.status].variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig[request.status].label}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedRequest(request)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {showActions && request.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleApprove(request.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => openRejectDialog(request.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            {request.status !== "pending" && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(request.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Approval Workflow
              </CardTitle>
              <CardDescription>
                Review and approve pending data changes before they are committed
              </CardDescription>
            </div>
            {requests.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all approval requests?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all approval requests including pending ones.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        clearAllRequests();
                        toast.success("All requests cleared");
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Check className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pending requests</p>
                  <p className="text-sm">All submissions have been processed</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => renderRequestRow(request, true))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {processedRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No history yet</p>
                  <p className="text-sm">Processed requests will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedRequests.map((request) => renderRequestRow(request, false))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className={selectedRequest?.type === "data_manipulation" && selectedRequest?.data ? "max-w-4xl" : "max-w-lg"}>
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              {selectedRequest && typeConfig[selectedRequest.type]?.label}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">File Name</Label>
                  <p className="font-medium">{selectedRequest.fileName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={statusConfig[selectedRequest.status].variant}>
                      {statusConfig[selectedRequest.status].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rows</Label>
                  <p className="font-medium">{selectedRequest.rowCount}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Columns</Label>
                  <p className="font-medium">{selectedRequest.columnCount}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted By</Label>
                  <p className="font-medium">{selectedRequest.submittedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted At</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.submittedAt), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>

              {selectedRequest.changes && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <Label className="text-muted-foreground">Change Details</Label>
                  <p className="font-medium mt-1">{selectedRequest.changes.description}</p>
                  <p className="text-sm text-muted-foreground">
                    Affected {selectedRequest.changes.affectedRows} rows
                  </p>
                </div>
              )}

              {/* Data Preview for Data Manipulation */}
              {selectedRequest.type === "data_manipulation" && selectedRequest.data && selectedRequest.data.rows.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Data Preview (First 10 rows)
                  </Label>
                  <ScrollArea className="h-[250px] rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {selectedRequest.data.columns.slice(0, 8).map((col) => (
                            <TableHead key={col.name} className="text-xs whitespace-nowrap">
                              {col.name}
                            </TableHead>
                          ))}
                          {selectedRequest.data.columns.length > 8 && (
                            <TableHead className="text-xs text-muted-foreground">
                              +{selectedRequest.data.columns.length - 8} more
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequest.data.rows.slice(0, 10).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {selectedRequest.data!.columns.slice(0, 8).map((col) => (
                              <TableCell key={col.name} className="text-xs py-2 max-w-[150px] truncate">
                                {String(row[col.name] ?? "")}
                              </TableCell>
                            ))}
                            {selectedRequest.data!.columns.length > 8 && (
                              <TableCell className="text-xs text-muted-foreground">...</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {selectedRequest.data.rows.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing 10 of {selectedRequest.data.rows.length} rows
                    </p>
                  )}
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div className="p-3 rounded-lg border">
                  <Label className="text-muted-foreground">Reviewed By</Label>
                  <p className="font-medium">{selectedRequest.reviewedBy}</p>
                  {selectedRequest.reviewedAt && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedRequest.reviewedAt), "MMM d, yyyy HH:mm")}
                    </p>
                  )}
                </div>
              )}

              {selectedRequest.rejectionReason && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <Label>Rejection Reason</Label>
                  </div>
                  <p className="mt-1">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalWorkflow;

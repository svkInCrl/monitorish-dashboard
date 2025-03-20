
import { useState } from "react";
import { FileList } from "@/components/critical-files/FileList";
import { AddFileForm } from "@/components/critical-files/AddFileForm";
import { PasswordProtection } from "@/components/critical-files/PasswordProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CriticalFiles() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFileDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Critical Files</h1>
        {isAuthenticated && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Critical File</DialogTitle>
              </DialogHeader>
              <AddFileForm onSuccess={() => {
                setOpen(false);
                setRefreshTrigger(prev => prev + 1);
              }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isAuthenticated ? (
        <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Monitored Files</CardTitle>
          </CardHeader>
          <CardContent>
            <FileList refreshTrigger={refreshTrigger} onFileDeleted={handleFileDeleted} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

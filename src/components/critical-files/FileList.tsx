
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

interface CriticalFile {
  id: string; // Django BigAutoField corresponds to number, not string
  file_name: string;
  file_path: string;
  file_hash: string;
  file_type: string;
  added_by: string;
  added_at: string | null; // added_at is nullable in the model
}

interface FileListProps {
  refreshTrigger: number;
  onFileDeleted: () => void;
}

export function FileList({ refreshTrigger, onFileDeleted }: FileListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: files, isLoading, refetch } = useQuery({
    queryKey: ["criticalFiles", refreshTrigger],
    queryFn: async () => {
      const response = await fetch("http://127.0.0.1:8000/files/");
      if (!response.ok) {
        throw new Error("Failed to fetch critical files");
      }
      // console.log(response.json());
      return response.json() as Promise<CriticalFile[]>;
    },
  });

  useEffect(() => {
    refetch();
  }, [refreshTrigger, refetch]);

  const handleDelete = async (hash: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/files/${hash}/`, {
        method: "DELETE",
      });

      console.log(`trying to dlt`);
      
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      
      toast({
        title: "File removed",
        description: "The file has been removed from monitoring.",
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["criticalFiles"] });
      onFileDeleted();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to remove file from monitoring.  Error: ${error}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const fileType = (type: string) => {
    switch (type) {
      case "exe":
        return "Executable";
      case "dll":
        return "Dynamic Link Library";
      case "sys":
        return "System File";
      case "py":
        return "Python Script";
      case "sh":
        return "Shell Script";
      case "log":
        return "Log File";
      case "deb":
        return "Debian Package";
      case "rpm":
        return "Red Hat Package";
      case "zip":
        return "Zip Archive";
      case "tar":
        return "Tar Archive"; 
      case "json":
        return "JSON File";
      default:  
        return "Unknown";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File Name</TableHead>
          <TableHead>File Path</TableHead>
          <TableHead>Added By</TableHead>
          <TableHead>Added At</TableHead>
          <TableHead>File Type</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files?.map((file) => (
          <TableRow key={file.id}>
            <TableCell>{file.file_name}</TableCell>
            <TableCell className="font-mono text-xs">{file.file_path}</TableCell>
            <TableCell>{file.added_by}</TableCell>
            <TableCell>{new Date(file.added_at).toLocaleString()}</TableCell>
            <TableCell>{fileType(file.file_type)}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(file.file_hash)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

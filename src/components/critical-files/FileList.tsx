
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CriticalFile {
  id: string;
  file_name: string;
  file_path: string;
  file_hash: string;
  added_at: string;
  added_by: string;
  file_type: string;
}

export function FileList() {
  const { toast } = useToast();
  
  const { data: files, isLoading } = useQuery({
    queryKey: ["criticalFiles"],
    queryFn: async () => {
      const response = await fetch("http://127.0.0.1:8000/files/");
      if (!response.ok) {
        throw new Error("Failed to fetch critical files");
      }
      return response.json() as Promise<CriticalFile[]>;
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/files/${id}/`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      
      toast({
        title: "File removed",
        description: "The file has been removed from monitoring.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove file from monitoring.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
            <TableCell>{file.file_path}</TableCell>
            <TableCell>{file.added_by}</TableCell>
            <TableCell>{new Date(file.added_at).toLocaleString()}</TableCell>
            <TableCell>{file.file_type}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(file.id)}
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

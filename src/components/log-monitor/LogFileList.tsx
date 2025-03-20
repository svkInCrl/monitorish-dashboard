
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogFile } from "@/hooks/useLogData";
import { format } from "date-fns";
import { FileText } from "lucide-react";

interface LogFileListProps {
  logFiles: LogFile[];
  isLoading: boolean;
}

export function LogFileList({ logFiles, isLoading }: LogFileListProps) {
  if (isLoading) {
    return <div className="flex justify-center py-8">Loading log files...</div>;
  }

  if (!logFiles || logFiles.length === 0) {
    return <div className="text-center py-8">No log files are being monitored.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File Name</TableHead>
          <TableHead>Path</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Last Modified</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logFiles.map((file) => (
          <TableRow key={file.id}>
            <TableCell className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {file.name}
            </TableCell>
            <TableCell className="max-w-[250px] truncate" title={file.path}>
              {file.path}
            </TableCell>
            <TableCell>{file.size_kb} KB</TableCell>
            <TableCell>{format(new Date(file.last_modified), "MMM d, yyyy HH:mm:ss")}</TableCell>
            <TableCell>
              <Badge variant="outline">{file.type}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

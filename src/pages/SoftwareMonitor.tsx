
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, Code, ListVideo, History, Layers, Shield, XCircle } from "lucide-react";
import { usePaginatedSoftwareInfo } from "@/hooks/useSoftwareData";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const updateData = [
  { name: "Jan", updates: 5 },
  { name: "Feb", updates: 3 },
  { name: "Mar", updates: 7 },
  { name: "Apr", updates: 2 },
  { name: "May", updates: 8 },
  { name: "Jun", updates: 4 },
];

export default function SoftwareMonitor() {
  const { 
    data: softwareInfo, 
    isLoading: isLoadingSoftware,
    error: softwareError, 
    pagination
  } = usePaginatedSoftwareInfo(8);

  const getCategoryCounts = () => {
    return [
      { category: "Development", percentage: 35 },
      { category: "Productivity", percentage: 25 },
      { category: "Communication", percentage: 20 },
      { category: "Media", percentage: 15 },
      { category: "Other", percentage: 5 },
    ];
  };
  
  const categoryData = getCategoryCounts();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Software Monitor</h2>
        <p className="text-muted-foreground">
          Monitor installed applications and their status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Installed Software</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Applications tracked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Updates Available</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Security updates: 1
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Good</div>
            <p className="text-xs text-muted-foreground">
              All critical systems up to date
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="installed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="installed" className="flex items-center gap-2">
            <ListVideo className="h-4 w-4" />
            <span>Installed Software</span>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Update History</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Software Categories</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="installed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Installed Software</CardTitle>
              <CardDescription>
                All installed applications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Privilege</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSoftware ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">Loading software data...</TableCell>
                      </TableRow>
                    ) : softwareError ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-red-500">
                          Error loading software data
                        </TableCell>
                      </TableRow>
                    ) : softwareInfo && softwareInfo.length > 0 ? (
                      softwareInfo.map((app) => (
                        <TableRow key={app.sw_id}>
                          <TableCell className="font-medium">{app.sw_name}</TableCell>
                          <TableCell>{app.version}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{app.sw_privilege}</Badge>
                          </TableCell>
                          <TableCell>{app.installation_timestamp}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No software data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={pagination.prevPage} 
                        className={pagination.currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {pagination.currentPage > 2 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => pagination.goToPage(1)}>1</PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {pagination.currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {pagination.currentPage > 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => pagination.goToPage(pagination.currentPage - 1)}>
                          {pagination.currentPage - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationLink isActive>{pagination.currentPage}</PaginationLink>
                    </PaginationItem>
                    
                    {pagination.currentPage < pagination.totalPages && (
                      <PaginationItem>
                        <PaginationLink onClick={() => pagination.goToPage(pagination.currentPage + 1)}>
                          {pagination.currentPage + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {pagination.currentPage < pagination.totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {pagination.currentPage < pagination.totalPages - 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => pagination.goToPage(pagination.totalPages)}>
                          {pagination.totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={pagination.nextPage} 
                        className={pagination.currentPage >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="updates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Update History</CardTitle>
              <CardDescription>
                Software updates over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={updateData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ 
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: 'none'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="updates"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Software Categories</CardTitle>
              <CardDescription>
                Breakdown of installed applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((item, index) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-blue-500' : 
                            index === 1 ? 'bg-purple-500' : 
                            index === 2 ? 'bg-green-500' : 
                            index === 3 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`} 
                        />
                        <p className="text-sm font-medium">{item.category}</p>
                      </div>
                      <span className="text-sm">{item.percentage}%</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

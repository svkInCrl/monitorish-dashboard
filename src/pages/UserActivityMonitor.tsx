import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Clock, FileText, MailOpen, MousePointer, User, Users } from "lucide-react";
import { WindowActivityTracker } from "@/components/user-activity/WindowActivityTracker";
import { useFileActivityData, FileActivityLog } from "@/components/critical-files/FileMonitoringLogs";
import { useMemo } from "react";
import { format, subHours } from "date-fns";

// Sample data
const activityData = [
  { time: "09:00", sessions: 5, events: 120 },
  { time: "10:00", sessions: 8, events: 180 },
  { time: "11:00", sessions: 12, events: 240 },
  { time: "12:00", sessions: 10, events: 200 },
  { time: "13:00", sessions: 6, events: 140 },
  { time: "14:00", sessions: 9, events: 190 },
  { time: "15:00", sessions: 15, events: 280 },
  { time: "16:00", sessions: 14, events: 260 },
  { time: "17:00", sessions: 8, events: 160 },
];

const userData = [
  { 
    id: 1, 
    name: "Alex Johnson", 
    status: "Active", 
    lastActive: "Just now", 
    role: "Administrator",
    avatar: "https://i.pravatar.cc/150?img=1" 
  },
  { 
    id: 2, 
    name: "Sarah Parker", 
    status: "Active", 
    lastActive: "5 min ago", 
    role: "Developer",
    avatar: "https://i.pravatar.cc/150?img=2" 
  },
  { 
    id: 3, 
    name: "Michael Brown", 
    status: "Away", 
    lastActive: "25 min ago", 
    role: "Designer",
    avatar: "https://i.pravatar.cc/150?img=3" 
  },
  { 
    id: 4, 
    name: "Emily Davis", 
    status: "Away", 
    lastActive: "45 min ago", 
    role: "Manager",
    avatar: "https://i.pravatar.cc/150?img=4" 
  },
  { 
    id: 5, 
    name: "Chris Wilson", 
    status: "Inactive", 
    lastActive: "2 hours ago", 
    role: "Developer",
    avatar: "https://i.pravatar.cc/150?img=5" 
  },
  { 
    id: 6, 
    name: "Taylor Smith", 
    status: "Inactive", 
    lastActive: "3 hours ago", 
    role: "Support",
    avatar: "https://i.pravatar.cc/150?img=6" 
  },
];

const activityTypeData = [
  { name: 'Document Editing', value: 40 },
  { name: 'Email', value: 25 },
  { name: 'Meetings', value: 20 },
  { name: 'Web Browsing', value: 15 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5733'];

export default function UserActivityMonitor() {
  const fileActivities = useFileActivityData();

  // Process file activity data for the timeline
  const fileActivityTimeline = useMemo(() => {
    // Create hourly buckets for the last 8 hours
    const now = new Date();
    const hours = Array.from({ length: 8 }, (_, i) => {
      const hour = subHours(now, i);
      return {
        time: format(hour, "HH:00"),
        fileOpened: 0,
        fileModified: 0,
        fileDeleted: 0,
        hour: format(hour, "HH"),
      };
    }).reverse();

    // Count activities by hour
    fileActivities.forEach(activity => {
      const activityHour = format(new Date(activity.timestamp), "HH");
      const hourBucket = hours.find(h => h.hour === activityHour);
      
      if (hourBucket) {
        if (activity.action === "opened") hourBucket.fileOpened += 1;
        if (activity.action === "modified") hourBucket.fileModified += 1;
        if (activity.action === "deleted") hourBucket.fileDeleted += 1;
      }
    });

    return hours;
  }, [fileActivities]);

  // Process file activity data by type
  const fileActivityByType = useMemo(() => {
    const counts = {
      opened: fileActivities.filter(a => a.action === "opened").length,
      modified: fileActivities.filter(a => a.action === "modified").length,
      deleted: fileActivities.filter(a => a.action === "deleted").length,
    };

    return [
      { name: 'File Opened', value: counts.opened || 1 },
      { name: 'File Modified', value: counts.modified || 1 },
      { name: 'File Deleted', value: counts.deleted || 0 },
    ];
  }, [fileActivities]);

  // Combine file activity with other activity types
  const combinedActivityTypes = useMemo(() => {
    return [
      ...activityTypeData,
      { name: 'File Operations', value: fileActivities.length || 2 },
    ];
  }, [fileActivities]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Activity Monitor</h2>
        <p className="text-muted-foreground">
          Monitor user sessions and activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              2 active, 2 away, 2 inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 min</div>
            <p className="text-xs text-muted-foreground">
              Avg. session time today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documents Opened</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              12 documents edited
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Email Activity</CardTitle>
            <MailOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52</div>
            <p className="text-xs text-muted-foreground">
              Messages sent today
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              User sessions, events, and file activity over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[...activityData, ...fileActivityTimeline]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    contentStyle={{ 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sessions"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="events"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="fileOpened"
                    stroke="#00C49F"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="fileModified"
                    stroke="#FFBB28"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="fileDeleted"
                    stroke="#FF5733"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Activity by Type</CardTitle>
            <CardDescription>
              User activity categorized by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={combinedActivityTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {combinedActivityTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <WindowActivityTracker />
        
        <Card>
          <CardHeader>
            <CardTitle>Critical File Activity</CardTitle>
            <CardDescription>
              Recent activity on monitored files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] overflow-y-auto">
              {fileActivities.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No file activity recorded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fileActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Badge 
                            variant={
                              activity.action === "opened" ? "outline" : 
                              activity.action === "modified" ? "secondary" : 
                              "destructive"
                            }
                          >
                            {activity.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{activity.file_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(activity.timestamp), "HH:mm:ss")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Status</CardTitle>
          <CardDescription>
            All users and their current activity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Current Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{user.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${
                        user.status === "Active"
                          ? "border-green-500 text-green-500"
                          : user.status === "Away"
                          ? "border-amber-500 text-amber-500"
                          : "border-gray-500 text-gray-500"
                      }`}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.lastActive}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {user.status === "Active" 
                          ? "Using spreadsheet" 
                          : user.status === "Away" 
                          ? "Away from keyboard" 
                          : "No activity"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

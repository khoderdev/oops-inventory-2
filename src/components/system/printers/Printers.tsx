import { printerAPI } from "@/api/printer.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { CreatePrinterChannelRequest, CreatePrinterRequest, Printer, PrinterChannel } from "@/types/printer";
import { AlertCircle, CheckCircle, Loader2, Monitor, Network, Plus, Printer as PrinterIcon, Settings, Trash2, Wifi, X } from "lucide-react";
import { useEffect, useState } from "react";

const Printers = () => {
  const [channels, setChannels] = useState<PrinterChannel[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("channels");

  // Dialog states
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<PrinterChannel | null>(null);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);

  // Testing states
  const [testingPrinters, setTestingPrinters] = useState<Set<number>>(new Set());
  const [testResults, setTestResults] = useState<Map<number, { success: boolean; message: string; timestamp: Date }>>(new Map());

  // Form states
  const [channelForm, setChannelForm] = useState({
    name: "",
    description: "",
    priority: 1
  });

  const [printerForm, setPrinterForm] = useState({
    name: "",
    channelId: "",
    type: "thermal" as "thermal" | "inkjet" | "laser" | "receipt" | "label",
    connectionType: "network" as "usb" | "network" | "bluetooth" | "serial",
    location: "",
    description: "",
    networkConfig: {
      ipAddress: "",
      port: 9100,
      protocol: "raw"
    },
    osConfig: {
      printerName: "",
      driverName: ""
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-clear success/error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [channelsResponse, printersResponse] = await Promise.all([printerAPI.getChannels(), printerAPI.getPrinters()]);

      if (channelsResponse.success) {
        setChannels(channelsResponse.channels || []);
      }

      if (printersResponse.success) {
        setPrinters(printersResponse.printers || []);
      }
    } catch (err) {
      setError("Failed to fetch printer data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit channel
  const handleEditChannel = (channel: PrinterChannel) => {
    setEditingChannel(channel);
    setChannelForm({
      name: channel.name,
      description: channel.description || "",
      priority: channel.priority
    });
    setChannelDialogOpen(true);
  };

  // Handle edit printer
  const handleEditPrinter = (printer: Printer) => {
    setEditingPrinter(printer);
    setPrinterForm({
      name: printer.name,
      channelId: printer.channelId.toString(),
      type: printer.type,
      connectionType: printer.connectionType,
      location: printer.location || "",
      description: printer.description || "",
      networkConfig: {
        ipAddress: printer.networkConfig?.ipAddress || "",
        port: printer.networkConfig?.port || 9100,
        protocol: printer.networkConfig?.protocol || "raw"
      },
      osConfig: {
        printerName: printer.osConfig?.printerName || "",
        driverName: printer.osConfig?.driverName || ""
      }
    });
    setPrinterDialogOpen(true);
  };

  const handleCreateChannel = async () => {
    try {
      setOperationLoading(true);
      clearMessages();

      const channelData: CreatePrinterChannelRequest = {
        name: channelForm.name,
        description: channelForm.description,
        priority: channelForm.priority
      };

      let response;
      if (editingChannel) {
        response = await printerAPI.updateChannel(editingChannel.id, channelData);
      } else {
        response = await printerAPI.createChannel(channelData);
      }

      if (response.success) {
        setSuccess(editingChannel ? "Channel updated successfully" : "Channel created successfully");
        await fetchData();
        setChannelDialogOpen(false);
        resetChannelForm();
      }
    } catch (err) {
      console.error("Error saving channel:", err);
      setError(editingChannel ? "Failed to update channel" : "Failed to create channel");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleCreatePrinter = async () => {
    try {
      setOperationLoading(true);
      clearMessages();

      const printerData: CreatePrinterRequest = {
        name: printerForm.name,
        channelId: parseInt(printerForm.channelId),
        type: printerForm.type,
        connectionType: printerForm.connectionType,
        location: printerForm.location,
        description: printerForm.description,
        networkConfig: printerForm.connectionType === "network" ? printerForm.networkConfig : undefined,
        osConfig: printerForm.connectionType === "usb" ? printerForm.osConfig : undefined
      };

      let response;
      if (editingPrinter) {
        response = await printerAPI.updatePrinter(editingPrinter.id, printerData);
      } else {
        response = await printerAPI.createPrinter(printerData);
      }

      if (response.success) {
        setSuccess(editingPrinter ? "Printer updated successfully" : "Printer created successfully");
        await fetchData();
        setPrinterDialogOpen(false);
        resetPrinterForm();
      }
    } catch (err) {
      console.error("Error saving printer:", err);
      setError(editingPrinter ? "Failed to update printer" : "Failed to create printer");
    } finally {
      setOperationLoading(false);
    }
  };

  const resetChannelForm = () => {
    setChannelForm({ name: "", description: "", priority: 1 });
    setEditingChannel(null);
  };

  const resetPrinterForm = () => {
    setPrinterForm({
      name: "",
      channelId: "",
      type: "thermal" as "thermal" | "inkjet" | "laser" | "receipt" | "label",
      connectionType: "network" as "usb" | "network" | "bluetooth" | "serial",
      location: "",
      description: "",
      networkConfig: { ipAddress: "", port: 9100, protocol: "raw" },
      osConfig: { printerName: "", driverName: "" }
    });
    setEditingPrinter(null);
  };

  const handleDeleteChannel = async (id: number) => {
    if (!confirm("Are you sure you want to delete this channel?")) return;

    try {
      const response = await printerAPI.deleteChannel(id);
      if (response.success) {
        setSuccess("Channel deleted successfully");
        await fetchData();
      }
    } catch (err) {
      console.error("Error deleting channel:", err);
      setError("Failed to delete channel");
    }
  };

  const handleDeletePrinter = async (id: number) => {
    if (!confirm("Are you sure you want to delete this printer?")) return;

    try {
      const response = await printerAPI.deletePrinter(id);
      if (response.success) {
        setSuccess("Printer deleted successfully");
        await fetchData();
      }
    } catch (err) {
      console.error("Error deleting printer:", err);
      setError("Failed to delete printer");
    }
  };

  const handleTestPrinter = async (id: number) => {
    try {
      // Add printer to testing set
      setTestingPrinters(prev => new Set([...prev, id]));

      // Clear previous test result and any global messages
      setTestResults(prev => {
        const newResults = new Map(prev);
        newResults.delete(id);
        return newResults;
      });
      clearMessages();

      const response = await printerAPI.testPrinter(id);

      const testResult = {
        success: response.success,
        message: response.success ? "Connected successfully" : (response.testResult?.error || response.message || "Connection failed"),
        timestamp: new Date()
      };

      // Store test result
      setTestResults(prev => new Map([...prev, [id, testResult]]));

      // Update printer status in local state
      if (response.success) {
        setPrinters(prev => prev.map(p => p.id === id ? { ...p, status: 'online' } : p));
      } else {
        setPrinters(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
      }
    } catch (err) {
      console.error("Error testing printer:", err);
      const errorResult = {
        success: false,
        message: "Connection failed",
        timestamp: new Date()
      };
      setTestResults(prev => new Map([...prev, [id, errorResult]]));
      setPrinters(prev => prev.map(p => p.id === id ? { ...p, status: 'error' } : p));
    } finally {
      // Remove printer from testing set
      setTestingPrinters(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Get test result for a printer
  const getTestResult = (printerId: number) => {
    return testResults.get(printerId);
  };

  // Check if printer is currently being tested
  const isPrinterTesting = (printerId: number) => {
    return testingPrinters.has(printerId);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: "default",
      offline: "secondary",
      error: "destructive",
      busy: "outline",
      maintenance: "outline"
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "network":
        return <Network className="h-4 w-4" />;
      case "usb":
        return <Monitor className="h-4 w-4" />;
      case "bluetooth":
        return <Wifi className="h-4 w-4" />;
      default:
        return <PrinterIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading printers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Button onClick={fetchData} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {(success || error) && (
        <div className="space-y-2">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
              <span>{success}</span>
              <Button variant="ghost" size="sm" onClick={clearMessages}>
                ×
              </Button>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearMessages}>
                ×
              </Button>
            </div>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="printers">Printers</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Printer Channels</h2>
            <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetChannelForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Channel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingChannel ? "Edit Printer Channel" : "Create Printer Channel"}</DialogTitle>
                  <DialogDescription>{editingChannel ? "Update the printer channel settings" : "Create a new printer channel to organize your printers"}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Channel Name</Label>
                    <Input id="name" value={channelForm.name} onChange={e => setChannelForm({ ...channelForm, name: e.target.value })} placeholder="e.g., Kitchen Orders" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={channelForm.description} onChange={e => setChannelForm({ ...channelForm, description: e.target.value })} placeholder="Optional description" />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Input id="priority" type="number" min="1" max="10" value={channelForm.priority} onChange={e => setChannelForm({ ...channelForm, priority: parseInt(e.target.value) })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setChannelDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateChannel} disabled={operationLoading}>
                    {operationLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingChannel ? "Update Channel" : "Create Channel"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {channels.map(channel => (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {channel.name}
                        <Badge variant={channel.isActive ? "default" : "secondary"}>{channel.isActive ? "Active" : "Inactive"}</Badge>
                      </CardTitle>
                      <CardDescription>{channel.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditChannel(channel)} title="Edit Channel">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteChannel(channel.id)} title="Delete Channel" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Priority: {channel.priority}</span>
                    <span>{channel.printers?.length || 0} printers</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="printers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Printers</h2>
            <Dialog open={printerDialogOpen} onOpenChange={setPrinterDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetPrinterForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Printer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPrinter ? "Edit Printer" : "Add New Printer"}</DialogTitle>
                  <DialogDescription>{editingPrinter ? "Update the printer configuration" : "Configure a new printer for your system"}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="printer-name">Printer Name</Label>
                      <Input id="printer-name" value={printerForm.name} onChange={e => setPrinterForm({ ...printerForm, name: e.target.value })} placeholder="e.g., Kitchen Printer 1" />
                    </div>
                    <div>
                      <Label htmlFor="channel">Channel</Label>
                      <Select value={printerForm.channelId} onValueChange={value => setPrinterForm({ ...printerForm, channelId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map(channel => (
                            <SelectItem key={channel.id} value={channel.id.toString()}>
                              {channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Printer Type</Label>
                      <Select value={printerForm.type} onValueChange={(value: "thermal" | "receipt" | "label" | "inkjet" | "laser") => setPrinterForm({ ...printerForm, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="thermal">Thermal</SelectItem>
                          <SelectItem value="receipt">Receipt</SelectItem>
                          <SelectItem value="label">Label</SelectItem>
                          <SelectItem value="inkjet">Inkjet</SelectItem>
                          <SelectItem value="laser">Laser</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="connection">Connection Type</Label>
                      <Select value={printerForm.connectionType} onValueChange={(value: "usb" | "network" | "bluetooth" | "serial") => setPrinterForm({ ...printerForm, connectionType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="network">Network</SelectItem>
                          <SelectItem value="usb">USB</SelectItem>
                          <SelectItem value="bluetooth">Bluetooth</SelectItem>
                          <SelectItem value="serial">Serial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {printerForm.connectionType === "network" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ip">IP Address</Label>
                        <Input
                          id="ip"
                          value={printerForm.networkConfig.ipAddress}
                          onChange={e =>
                            setPrinterForm({
                              ...printerForm,
                              networkConfig: { ...printerForm.networkConfig, ipAddress: e.target.value }
                            })
                          }
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          type="number"
                          value={printerForm.networkConfig.port}
                          onChange={e =>
                            setPrinterForm({
                              ...printerForm,
                              networkConfig: { ...printerForm.networkConfig, port: parseInt(e.target.value) }
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {printerForm.connectionType === "usb" && (
                    <div>
                      <Label htmlFor="os-printer">Windows Printer Name</Label>
                      <Input
                        id="os-printer"
                        value={printerForm.osConfig.printerName}
                        onChange={e =>
                          setPrinterForm({
                            ...printerForm,
                            osConfig: { ...printerForm.osConfig, printerName: e.target.value }
                          })
                        }
                        placeholder="EPSON TM-T88V Receipt"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={printerForm.location} onChange={e => setPrinterForm({ ...printerForm, location: e.target.value })} placeholder="e.g., Kitchen Counter" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPrinterDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePrinter} disabled={operationLoading}>
                    {operationLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingPrinter ? "Update Printer" : "Add Printer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Connection</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printers.map(printer => (
                    <TableRow key={printer.id}>
                      <TableCell className="font-medium">{printer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(printer.type)}
                          {printer.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(printer.connectionType)}
                          {printer.connectionType}
                        </div>
                      </TableCell>
                      <TableCell>{printer.channel?.name}</TableCell>
                      <TableCell>{getStatusBadge(printer.status)}</TableCell>
                      <TableCell>{printer.location || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Button variant="outline" size="sm" onClick={() => handleTestPrinter(printer.id)} disabled={isPrinterTesting(printer.id)} title="Test Printer Connection" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              {isPrinterTesting(printer.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <PrinterIcon className="h-4 w-4" />}
                            </Button>
                            {/* Test result indicator */}
                            {(() => {
                              const result = getTestResult(printer.id);
                              if (result && !isPrinterTesting(printer.id)) {
                                return <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${result.success ? "bg-green-500" : "bg-red-500"}`} title={`Last test: ${result.message} (${result.timestamp.toLocaleTimeString()})`} />;
                              }
                              return null;
                            })()}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleEditPrinter(printer)} title="Edit Printer">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeletePrinter(printer.id)} title="Delete Printer" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Test result details */}
                        {(() => {
                          const result = getTestResult(printer.id);
                          if (result && !isPrinterTesting(printer.id)) {
                            return (
                              <div className={`mt-1 text-xs flex items-center gap-1 ${result.success ? "text-green-600" : "text-red-600"}`}>
                                {result.success ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                <span>{result.message}</span>
                                <span className="text-gray-400 ml-1">({result.timestamp.toLocaleTimeString()})</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Printers;

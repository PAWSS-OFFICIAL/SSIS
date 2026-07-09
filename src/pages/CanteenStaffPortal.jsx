import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ShoppingBag, CheckCircle, Clock, ChefHat, Package, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const CanteenStaffPortal = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Simple protection
    if (localStorage.getItem("canteenAuth") !== "true") {
      navigate("/login");
      return;
    }
    loadOrders();
    
    // Poll for new orders every 5 seconds
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const loadOrders = () => {
    const storedOrders = JSON.parse(localStorage.getItem("canteenOrders") || "[]");
    setOrders(storedOrders);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    localStorage.setItem("canteenOrders", JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
    toast.success(`Order #${orderId} marked as ${newStatus}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("canteenAuth");
    navigate("/login");
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "Pending": 
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "Preparing": 
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200"><ChefHat className="w-3 h-3 mr-1" /> Preparing</Badge>;
      case "Ready": 
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200"><Package className="w-3 h-3 mr-1" /> Ready</Badge>;
      case "Completed": 
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      default: 
        return <Badge variant="outline" className="bg-slate-100 text-slate-800">{status}</Badge>;
    }
  };

  const activeOrders = orders.filter(o => o.status !== "Completed");
  const completedOrders = orders.filter(o => o.status === "Completed");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">🍽️ Canteen Staff Portal</h2>
            <p className="text-slate-500">Live order processing and queue management.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-semibold text-lg">{activeOrders.length}</span>
              <span className="text-sm">Active</span>
            </div>
            <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-md border-t-4 border-t-blue-500">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle>Live Order Queue</CardTitle>
                <CardDescription>Process orders from Pending to Ready</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium text-slate-700">No active orders</p>
                    <p>Waiting for new orders...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-24">ID</TableHead>
                          <TableHead className="w-40">Beneficiary</TableHead>
                          <TableHead className="min-w-[200px]">Items</TableHead>
                          <TableHead className="w-32">Status</TableHead>
                          <TableHead className="w-32 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeOrders.map((order) => (
                          <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-bold text-slate-700">
                              #{order.id}
                              <div className="font-medium text-xs text-slate-400 mt-1">
                                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </TableCell>
                            <TableCell>
                              {order.orderType === 'student' ? (
                                <div>
                                  <span className="font-bold text-[#1a365d]">{order.studentDetails?.name}</span>
                                  <div className="text-xs bg-slate-100 inline-block px-1.5 rounded mt-1">
                                    Class {order.studentDetails?.class} - {order.studentDetails?.section}
                                  </div>
                                </div>
                              ) : order.orderType === 'child' ? (
                                <div>
                                  <span className="font-bold text-[#1a365d]">{order.studentDetails?.name || `Child of ${order.placedBy || 'Parent'}`}</span>
                                  {order.studentDetails?.class && (
                                    <div className="text-xs bg-slate-100 inline-block px-1.5 rounded mt-1">
                                      Class {order.studentDetails.class} - {order.studentDetails.section}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className="font-bold text-slate-700">
                                    {order.placedBy || 'Staff Member'}
                                  </span>
                                  <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Staff</div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{item.quantity}x</span>
                                    <span className="font-medium">{item.name}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(order.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col gap-2">
                                {order.status === "Pending" && (
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 w-full" onClick={() => updateOrderStatus(order.id, "Preparing")}>
                                    <ChefHat className="w-3 h-3 mr-1" /> Prepare
                                  </Button>
                                )}
                                {order.status === "Preparing" && (
                                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 w-full" onClick={() => updateOrderStatus(order.id, "Ready")}>
                                    <Package className="w-3 h-3 mr-1" /> Ready
                                  </Button>
                                )}
                                {order.status === "Ready" && (
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 w-full" onClick={() => updateOrderStatus(order.id, "Completed")}>
                                    <CheckCircle className="w-3 h-3 mr-1" /> Deliver
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-lg">Recently Completed</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {completedOrders.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No completed orders today.</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {completedOrders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                        <div>
                          <p className="font-bold text-sm">#{order.id}</p>
                          <p className="text-xs text-slate-500">
                            {order.orderType === 'student' || order.orderType === 'child' 
                              ? (order.studentDetails?.name || `Child of ${order.placedBy || 'Parent'}`)
                              : (order.placedBy || 'Staff Member')}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

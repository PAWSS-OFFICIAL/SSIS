import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ShoppingBag, CheckCircle, Clock, ChefHat, Package } from "lucide-react";
import { toast } from "sonner";

export const CanteenPortal = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

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

  return (
    <DashboardLayout title="Canteen Portal">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Canteen Operations Portal</h2>
            <p className="text-slate-500">Manage all incoming food orders, update statuses, and view student details.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-semibold text-lg">{orders.length}</span>
              <span className="text-sm">Orders</span>
            </div>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle>Live Order Queue</CardTitle>
            <CardDescription>Process orders from Pending to Completed</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-700">No orders currently</p>
                <p>New orders will appear here automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-24">Order ID</TableHead>
                      <TableHead className="w-32">Time</TableHead>
                      <TableHead className="w-48">Student / Beneficiary</TableHead>
                      <TableHead className="min-w-[200px]">Items Ordered</TableHead>
                      <TableHead className="w-24 text-right">Amount</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead className="w-48 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-slate-700">#{order.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(order.timestamp).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.orderType === 'student' ? (
                            <div>
                              <span className="font-bold text-[#1a365d]">{order.studentDetails?.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs bg-slate-100">
                                  Class {order.studentDetails?.class} - {order.studentDetails?.section}
                                </Badge>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                                By {order.placedByRole} ({order.placedBy})
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-700">
                                {order.orderType === 'child' ? "Parent's Child" : "Staff Member"}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                                Ordered by {order.placedByRole} ({order.placedBy})
                              </div>
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
                        <TableCell className="text-right">
                          <span className="font-bold text-emerald-600 text-lg">₹{order.totalAmount}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {order.status === "Pending" && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8" onClick={() => updateOrderStatus(order.id, "Preparing")}>
                                <ChefHat className="w-3 h-3 mr-1" /> Prepare
                              </Button>
                            )}
                            {order.status === "Preparing" && (
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-8" onClick={() => updateOrderStatus(order.id, "Ready")}>
                                <Package className="w-3 h-3 mr-1" /> Ready
                              </Button>
                            )}
                            {order.status === "Ready" && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => updateOrderStatus(order.id, "Completed")}>
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
    </DashboardLayout>
  );
};

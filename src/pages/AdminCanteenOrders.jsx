import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { ShoppingBag } from "lucide-react";

export const AdminCanteenOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch from localStorage for mock backend
    const storedOrders = JSON.parse(localStorage.getItem("canteenOrders") || "[]");
    setOrders(storedOrders);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Preparing": return "bg-blue-100 text-blue-800";
      case "Ready": return "bg-purple-100 text-purple-800";
      case "Completed": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <DashboardLayout title="Canteen Orders">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Canteen Records</h2>
            <p className="text-slate-500">Read-only view of all food orders placed in the system.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm">
            <ShoppingBag className="w-5 h-5 text-slate-400" />
            <span className="font-semibold">{orders.length} Total Orders</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No orders have been placed yet.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Placed By</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <br />
                          <span className="text-xs text-slate-400">
                            {new Date(order.timestamp).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {order.placedBy}
                          <br />
                          <span className="text-xs text-slate-500">{order.placedByRole}</span>
                        </TableCell>
                        <TableCell>
                          {order.orderType === 'student' ? (
                            <div>
                              <span className="font-medium">{order.studentDetails?.name}</span>
                              <br />
                              <span className="text-xs text-slate-500">
                                Class {order.studentDetails?.class}-{order.studentDetails?.section}
                              </span>
                            </div>
                          ) : order.orderType === 'child' ? (
                            <span className="text-sm text-slate-600">Their Child</span>
                          ) : (
                            <span className="text-sm text-slate-600">Self</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {order.items.map((item, i) => (
                              <div key={i} className="text-sm truncate">
                                {item.quantity}x {item.name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-[#1a365d]">
                          ₹{order.totalAmount}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
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

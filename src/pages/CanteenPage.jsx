import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ShoppingCart, Plus, Minus, Search, CreditCard, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const MENU_ITEMS = [
  { id: 1, name: "Samosa", price: 15, category: "Snacks", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80" },
  { id: 2, name: "Chilli Bajji", price: 20, category: "Snacks", image: "https://images.unsplash.com/photo-1626804475297-41609ea084eb?w=500&q=80" },
  { id: 3, name: "Bread Bajji", price: 25, category: "Snacks", image: "https://images.unsplash.com/photo-1594998893017-36147cbcae05?w=500&q=80" },
  { id: 4, name: "Chocolate Chip Cookies", price: 30, category: "Desserts", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80" },
  { id: 5, name: "Assorted Chocolates", price: 40, category: "Desserts", image: "https://images.unsplash.com/photo-1540331547168-8b63109225b7?w=500&q=80" },
  { id: 6, name: "Lollipop", price: 10, category: "Desserts", image: "https://images.unsplash.com/photo-1575224300306-1b8da36134ec?w=500&q=80" },
  { id: 7, name: "Veg Sandwich", price: 45, category: "Meals", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&q=80" },
  { id: 8, name: "Fresh Orange Juice", price: 35, category: "Beverages", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&q=80" },
];

export const CanteenPage = () => {
  const { user } = useAuth();
  
  // State for order context
  const [orderType, setOrderType] = useState(user?.role === "Parent" ? "child" : null); // "self" or "student" or "child"
  const [studentDetails, setStudentDetails] = useState({ name: "", class: "", section: "" });
  const [isDetailsConfirmed, setIsDetailsConfirmed] = useState(user?.role === "Parent");
  
  // Cart state
  const [cart, setCart] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (item) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[item.id] > 1) {
        newCart[item.id] -= 1;
      } else {
        delete newCart[item.id];
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = MENU_ITEMS.find(i => i.id === parseInt(itemId));
      return total + (item.price * quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const orderTotal = getCartTotal();
    const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
      const item = MENU_ITEMS.find(i => i.id === parseInt(itemId));
      return { ...item, quantity };
    });

    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      placedBy: user?.full_name || user?.name || user?.username || "Unknown",
      placedByRole: user?.role,
      orderType,
      studentDetails: orderType === 'student' ? studentDetails : orderType === 'child' ? {
        name: user.student_name,
        class: user.class_name,
        section: user.section_name
      } : null,
      items: orderItems,
      totalAmount: orderTotal,
      status: "Pending",
      timestamp: new Date().toISOString()
    };

    // Save to localStorage for mock backend
    const existingOrders = JSON.parse(localStorage.getItem("canteenOrders") || "[]");
    localStorage.setItem("canteenOrders", JSON.stringify([newOrder, ...existingOrders]));

    toast.success(`Order placed successfully! Total: ₹${orderTotal}`);
    setCart({});
  };

  const filteredItems = MENU_ITEMS.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If Teacher hasn't selected order type
  if (user?.role === "Teacher" && !orderType) {
    return (
      <DashboardLayout title="Canteen">
        <div className="max-w-2xl mx-auto mt-10">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Canteen</CardTitle>
              <CardDescription>Who are you ordering for today?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="flex-1 h-32 text-lg flex flex-col gap-2" 
                variant="outline"
                onClick={() => { setOrderType("self"); setIsDetailsConfirmed(true); }}
              >
                <span>Order for Myself</span>
              </Button>
              <Button 
                className="flex-1 h-32 text-lg flex flex-col gap-2"
                onClick={() => setOrderType("student")}
              >
                <span>Order for a Student</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // If Teacher selected "student" but hasn't filled details
  if (user?.role === "Teacher" && orderType === "student" && !isDetailsConfirmed) {
    return (
      <DashboardLayout title="Canteen">
        <div className="max-w-xl mx-auto mt-10">
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>Please enter the details of the student you are ordering for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input 
                  placeholder="E.g. Rahul Sharma" 
                  value={studentDetails.name}
                  onChange={(e) => setStudentDetails({...studentDetails, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Input 
                    placeholder="E.g. 10" 
                    value={studentDetails.class}
                    onChange={(e) => setStudentDetails({...studentDetails, class: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input 
                    placeholder="E.g. A" 
                    value={studentDetails.section}
                    onChange={(e) => setStudentDetails({...studentDetails, section: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <Button variant="outline" onClick={() => setOrderType(null)}>Back</Button>
                <Button 
                  className="flex-1 bg-[#1a365d] hover:bg-[#2a4a7f]"
                  disabled={!studentDetails.name || !studentDetails.class || !studentDetails.section}
                  onClick={() => setIsDetailsConfirmed(true)}
                >
                  Continue to Menu <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Canteen Menu">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Menu Section */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Fresh & Delicious</h2>
              <p className="text-slate-500">
                {orderType === "student" 
                  ? `Ordering for: ${studentDetails.name} (${studentDetails.class}-${studentDetails.section})`
                  : orderType === "child" 
                    ? "Ordering for your child"
                    : "Ordering for yourself"}
              </p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                className="pl-9" 
                placeholder="Search food..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 w-full overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{item.category}</span>
                    </div>
                    <span className="font-bold text-[#1a365d]">₹{item.price}</span>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    {cart[item.id] ? (
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-md" onClick={() => handleRemoveFromCart(item)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium w-4 text-center">{cart[item.id]}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-md" onClick={() => handleAddToCart(item)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full bg-[#1a365d] hover:bg-[#2a4a7f]" onClick={() => handleAddToCart(item)}>
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-slate-500">No items found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0">
          <Card className="sticky top-6">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Your Order
              </CardTitle>
              <CardDescription>
                {getCartItemsCount()} items in cart
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {Object.keys(cart).length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Your cart is empty</p>
                  <p className="text-sm mt-1">Add some delicious items from the menu!</p>
                </div>
              ) : (
                <div className="p-4 space-y-4 max-h-[40vh] overflow-y-auto">
                  {Object.entries(cart).map(([itemId, quantity]) => {
                    const item = MENU_ITEMS.find(i => i.id === parseInt(itemId));
                    return (
                      <div key={itemId} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-slate-500">₹{item.price} x {quantity}</p>
                        </div>
                        <div className="font-semibold text-sm">
                          ₹{item.price * quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {Object.keys(cart).length > 0 && (
                <div className="p-4 bg-slate-50 border-t space-y-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#1a365d]">₹{getCartTotal()}</span>
                  </div>
                  <Button className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" onClick={handleCheckout}>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Place Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

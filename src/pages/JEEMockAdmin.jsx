import React from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { QuestionBankTab } from "../components/JEEAdmin/QuestionBankTab";
import { PostQuizTab } from "../components/JEEAdmin/PostQuizTab";
import { ReviewDashboard } from "../components/JEEAdmin/ReviewDashboard";

export function JEEMockAdmin() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">JEE Mock Administration</h1>
        </div>

        <Tabs defaultValue="question-bank" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
            <TabsTrigger 
              value="question-bank" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#1a365d] data-[state=active]:bg-transparent rounded-none px-6 py-3"
            >
              Question Bank
            </TabsTrigger>
            <TabsTrigger 
              value="post-quiz"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#1a365d] data-[state=active]:bg-transparent rounded-none px-6 py-3"
            >
              Post Quiz
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#1a365d] data-[state=active]:bg-transparent rounded-none px-6 py-3"
            >
              Review Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="question-bank" className="mt-0">
            <QuestionBankTab />
          </TabsContent>

          <TabsContent value="post-quiz" className="mt-0">
            <PostQuizTab />
          </TabsContent>

          <TabsContent value="reviews" className="mt-0">
            <ReviewDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

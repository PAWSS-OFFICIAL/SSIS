import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient, useAuth } from "../App";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { DashboardSkeleton } from "../components/ui/skeleton";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ExternalLink,
  GraduationCap,
  Loader2,
  TrendingUp
} from "lucide-react";

export const JobsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        apiClient.get("/industry-bridge/jobs"),
        apiClient.get("/industry-bridge/my-applications").catch(() => ({ data: [] })),
      ]);
      setJobs(jobsRes.data.jobs || []);
      setApplications(appsRes.data || []);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    setApplying(jobId);
    try {
      await apiClient.post("/industry-bridge/apply", { job_id: jobId });
      toast.success("Application submitted successfully!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to apply");
    } finally {
      setApplying(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      !filterDepartment || job.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))];

  if (loading) {
    return (
      <DashboardLayout title="Job Opportunities">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Job Opportunities">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Available Jobs</p>
                <p className="text-2xl font-bold">{jobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">My Applications</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg Package</p>
                <p className="text-2xl font-bold">
                  {jobs.length > 0
                    ? Math.round(
                        jobs.reduce((acc, j) => acc + (j.package_lpa || 0), 0) / jobs.length
                      )
                    : 0} LPA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Companies</p>
                <p className="text-2xl font-bold">
                  {new Set(jobs.map((j) => j.company_name)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "available" ? "default" : "outline"}
          onClick={() => setActiveTab("available")}
        >
          Available Jobs
        </Button>
        <Button
          variant={activeTab === "applications" ? "default" : "outline"}
          onClick={() => setActiveTab("applications")}
        >
          My Applications
        </Button>
      </div>

      {activeTab === "available" && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search jobs or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Jobs List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{job.job_title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Building2 className="w-4 h-4" />
                          {job.company_name}
                        </CardDescription>
                      </div>
                      {job.has_applied ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          Applied
                        </Badge>
                      ) : (
                        <Badge variant="outline">Open</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-3 mb-4">
                      {job.package_lpa && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {job.package_lpa} LPA
                        </Badge>
                      )}
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        Min CGPA: {job.min_cgpa}
                      </Badge>
                      {job.department && (
                        <Badge variant="secondary">{job.department}</Badge>
                      )}
                    </div>

                    {job.requirements && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Requirements:</p>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          {JSON.parse(job.requirements || "[]").map((req, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        Apply by {new Date(job.last_date).toLocaleDateString()}
                      </div>
                      {job.has_applied ? (
                        <Button disabled variant="outline">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Applied
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleApply(job.id)}
                          disabled={applying === job.id}
                        >
                          {applying === job.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            "Apply Now"
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-500">
                <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No jobs found</p>
                <p className="text-sm">Check back later for new opportunities</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "applications" && (
        <Card>
          <CardHeader>
            <CardTitle>My Applications</CardTitle>
            <CardDescription>Track your job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div>
                      <h4 className="font-medium">{app.job_title}</h4>
                      <p className="text-sm text-slate-500">{app.company_name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Applied on {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        app.status === "selected"
                          ? "bg-emerald-100 text-emerald-700"
                          : app.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : app.status === "shortlisted"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No applications yet</p>
                <p className="text-sm">Apply to jobs to see them here</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

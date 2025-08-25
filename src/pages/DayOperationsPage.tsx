// import { BarChart3, Calendar, CheckCircle, Clock, DollarSign, Plus, ToggleLeft, ToggleRight, TrendingUp, XCircle } from "lucide-react";
// import React, { useState, useEffect } from "react";
// import { dayOperationsAPI } from "../api/dayOperations.api";
// import { useAuth } from "../contexts/AuthContext";
// import { useDayOperations } from "../contexts/DayOperationsContext";
// import DayOperationsModal from "../components/DayOperationsModal/DayOperationsModal";
// import DailyReports from "../components/analytics/DailyReports";
// import ViewReportButton from "../components/ui/ViewReportButton";
// import { useDailyReports } from "../hooks/useDailyReports";
// import { CloseDayRequest, DayOperation, OpenDayRequest } from "../types/inventory";
// import type { DayOperationsFormData } from "@/types/dayOperations";
// import { formatCurrency, formatDate, formatDateTime, formatWeekday } from "@/utils/dayOperationsFormattings";

// // Destructure API methods for cleaner usage
// const { getDayOperations } = dayOperationsAPI;

// const DayOperationsPage: React.FC = () => {
//   const { user } = useAuth();
//   const { currentDay, loading, error, success, openDay: contextOpenDay, closeDay: contextCloseDay, clearError, clearSuccess } = useDayOperations();

//   // Local state for page-specific data
//   const [recentDays, setRecentDays] = useState<DayOperation[]>([]);
//   const [showTotalSales, setShowTotalSales] = useState(true);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [openDayForm, setOpenDayForm] = useState<OpenDayRequest>({ openingCash: 0, openedBy: user?.fullName || "", notes: "" });
//   const [closeDayForm, setCloseDayForm] = useState<CloseDayRequest>({ closingCash: 0, closedBy: user?.fullName || "", notes: "", userId: user?.id as any });
//   const [showOpenModal, setShowOpenModal] = useState(false);
//   const [showCloseModal, setShowCloseModal] = useState(false);

//   // Daily reports hook
//   const { handleViewReport, showReportModal, setShowReportModal, selectedReport, loading: reportLoading, error: reportError, setError: setReportError } = useDailyReports();

//   // Real-time clock update
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000); // Update every second
//     return () => clearInterval(timer);
//   }, []);

//   // Load recent days data (current day is handled by context)
//   const loadRecentDays = async () => {
//     try {
//       const recentResponse = await getDayOperations(1, 10);
//       console.log("🔍 DayOperationsPage: Loading recent days data:", recentResponse.dayOperations.length);
//       setRecentDays(recentResponse.dayOperations);
//     } catch (err) {
//       console.error("❌ DayOperationsPage: Failed to load recent days:", err);
//     }
//   };

//   useEffect(() => {
//     loadRecentDays();
//   }, []);

//   // Keyboard event handler for Enter key
//   useEffect(() => {
//     const handleKeyPress = (event: KeyboardEvent) => {
//       if (event.key === "Enter" && !showOpenModal && !showCloseModal && !currentDay) {
//         event.preventDefault();
//         setShowOpenModal(true);
//       }
//     };

//     document.addEventListener("keydown", handleKeyPress);
//     return () => {
//       document.removeEventListener("keydown", handleKeyPress);
//     };
//   }, [showOpenModal, showCloseModal, currentDay]);

//   // Update form user fields when user changes
//   useEffect(() => {
//     if (user) {
//       if (user.fullName) {
//         setOpenDayForm(prev => ({
//           ...prev,
//           openedBy: user.fullName
//         }));
//         setCloseDayForm(prev => ({
//           ...prev,
//           closedBy: user.fullName
//         }));
//       }
//       // Always keep userId in sync for per-user operations
//       setOpenDayForm(prev => ({
//         ...prev,
//         userId: user.id as any
//       }));
//       setCloseDayForm(prev => ({
//         ...prev,
//         userId: user.id as any
//       }));
//     }
//   }, [user]);

//   const handleOpenDay = async () => {
//     try {
//       // Use context's openDay function which handles all state management
//       await contextOpenDay({ ...openDayForm, userId: user?.id as any });
//       setShowOpenModal(false);
//       setOpenDayForm({ openingCash: 0, openedBy: user?.fullName || "", notes: "", userId: user?.id as any });
//       // Refresh recent days to show the new day
//       loadRecentDays();
//     } catch (err) {
//       console.error("❌ DayOperationsPage: Failed to open day:", err);
//     }
//   };

//   const handleCloseDay = async () => {
//     try {
//       // Use context's closeDay function which handles all state management
//       await contextCloseDay({ ...closeDayForm, userId: user?.id as any });
//       setShowCloseModal(false);
//       setCloseDayForm({ closingCash: 0, closedBy: user?.fullName || "", notes: "", userId: user?.id as any });
//       // Refresh recent days to show the updated day
//       loadRecentDays();
//     } catch (err) {
//       console.error("❌ DayOperationsPage: Failed to close day:", err);
//     }
//   };

//   // Convert form data for the reusable modal component
//   const convertToModalFormData = (type: "open" | "close"): DayOperationsFormData => {
//     if (type === "open") {
//       return {
//         openingCash: openDayForm.openingCash,
//         openedBy: openDayForm.openedBy,
//         notes: openDayForm.notes
//       };
//     } else {
//       return {
//         closingCash: closeDayForm.closingCash,
//         closedBy: closeDayForm.closedBy,
//         notes: closeDayForm.notes
//       };
//     }
//   };

//   const handleModalFormChange = (type: "open" | "close", data: DayOperationsFormData) => {
//     if (type === "open") {
//       setOpenDayForm({
//         openingCash: data.openingCash || 0,
//         openedBy: data.openedBy || "",
//         notes: data.notes || ""
//       });
//     } else {
//       setCloseDayForm({
//         closingCash: data.closingCash || 0,
//         closedBy: data.closedBy || "",
//         notes: data.notes || ""
//       });
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading day operations...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
//       {/* Alerts */}
//       {error && (
//         <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center">
//           <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
//           <span className="text-red-700 text-sm sm:text-base flex-1">{error}</span>
//           <button onClick={clearError} className="ml-2 sm:ml-auto text-red-500 hover:text-red-700 text-lg sm:text-xl">
//             ×
//           </button>
//         </div>
//       )}

//       {reportError && (
//         <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center">
//           <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
//           <span className="text-red-700 text-sm sm:text-base flex-1">{reportError}</span>
//           <button onClick={() => setReportError(null)} className="ml-2 sm:ml-auto text-red-500 hover:text-red-700 text-lg sm:text-xl">
//             ×
//           </button>
//         </div>
//       )}

//       {success && (
//         <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center">
//           <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
//           <span className="text-green-700 text-sm sm:text-base flex-1">{success}</span>
//           <button onClick={clearSuccess} className="ml-2 sm:ml-auto text-green-500 hover:text-green-700 text-lg sm:text-xl">
//             ×
//           </button>
//         </div>
//       )}

//       {/* Current Day Status */}
//       <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 lg:mb-12">
//         <div className="lg:col-span-2">
//           <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
//               <div className="flex items-center space-x-3 sm:space-x-4">
//                 <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
//                   <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
//                 </div>
//                 <div>
//                   <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Current Day Status</h2>
//                   <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">
//                     {formatWeekday(currentTime)}, {formatDate(currentTime)}
//                   </p>
//                 </div>
//               </div>
//               <div className="text-left sm:text-right w-full sm:w-auto">
//                 <div className="text-xs sm:text-sm text-gray-500">Current Time</div>
//                 <div className="text-base sm:text-lg font-bold text-gray-900">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</div>
//                 <div className="text-xs sm:text-sm text-gray-500 mt-1">{formatDate(currentTime)}</div>
//               </div>
//             </div>

//             {currentDay ? (
//               <div className="space-y-6">
//                 {currentDay.status === "opened" ? (
//                   <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
//                     <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-green-100 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16 opacity-50"></div>
//                     <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
//                       <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
//                         <div className="p-2 sm:p-3 lg:p-4 bg-green-100 rounded-xl sm:rounded-2xl shadow-md">
//                           <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-600" />
//                         </div>
//                         <div>
//                           <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900 mb-1 sm:mb-2">Day is Open & Active</h3>
//                           <p className="text-sm sm:text-base lg:text-lg text-green-700 mb-1">Opened at {formatDateTime(currentDay.openedAt)}</p>
//                           <p className="text-xs sm:text-sm lg:text-base text-green-600">
//                             Managed by <span className="font-semibold">{currentDay.openedBy}</span>
//                           </p>
//                         </div>
//                       </div>
//                       <button onClick={() => setShowCloseModal(true)} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm sm:text-base lg:text-lg w-full sm:w-auto">
//                         Close Shift
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="relative overflow-hidden bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
//                     <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gray-100 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16 opacity-50"></div>
//                     <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
//                       <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
//                         <div className="p-2 sm:p-3 lg:p-4 bg-gray-100 rounded-xl sm:rounded-2xl shadow-md">
//                           <XCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-600" />
//                         </div>
//                         <div>
//                           <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Day is Closed</h3>
//                           <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-1">{currentDay.closedAt ? `Closed at ${formatDateTime(currentDay.closedAt)}` : "Day was closed"}</p>
//                           <p className="text-xs sm:text-sm lg:text-base text-gray-600">
//                             {currentDay.closedBy && (
//                               <span>
//                                 Managed by <span className="font-semibold">{currentDay.closedBy}</span>
//                               </span>
//                             )}
//                           </p>
//                         </div>
//                       </div>
//                       <button onClick={() => setShowOpenModal(true)} className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm sm:text-base lg:text-lg w-full sm:w-auto">
//                         Open New Day
//                       </button>
//                     </div>
//                   </div>
//                 )}
//                 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
//                   <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
//                     <div className="flex flex-col items-center text-center">
//                       <div className="p-3 bg-blue-200 rounded-lg mb-3">
//                         <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-700" />
//                       </div>
//                       <span className="text-sm sm:text-base font-medium text-blue-800 mb-2">Opening Cash</span>
//                       <p className="text-xl sm:text-2xl font-bold text-blue-900">{formatCurrency(currentDay?.openingCash)}</p>
//                     </div>
//                   </div>

//                   {/* Total Sales - conditionally shown based on toggle */}
//                   {showTotalSales && (
//                     <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
//                       <div className="flex flex-col items-center text-center relative">
//                         <button onClick={() => setShowTotalSales(false)} className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors" title="Show Expected Cash">
//                           <ToggleRight className="h-4 w-4 sm:h-5 sm:w-5" />
//                         </button>
//                         <div className="p-3 bg-green-200 rounded-lg mb-3">
//                           <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-700" />
//                         </div>
//                         <span className="text-sm sm:text-base font-medium text-green-800 mb-2">Total Sales</span>
//                         <p className="text-xl sm:text-2xl font-bold text-green-900">{formatCurrency(currentDay?.totalSales)}</p>
//                       </div>
//                     </div>
//                   )}

//                   {/* Expected Cash - conditionally shown based on toggle */}
//                   {!showTotalSales && (
//                     <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
//                       <div className="flex flex-col items-center text-center relative">
//                         <button onClick={() => setShowTotalSales(true)} className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors" title="Show Total Sales">
//                           <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5" />
//                         </button>
//                         <div className="p-3 bg-orange-200 rounded-lg mb-3">
//                           <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-700" />
//                         </div>
//                         <span className="text-sm sm:text-base font-medium text-orange-800 mb-2">Expected Cash</span>
//                         <p className="text-xl sm:text-2xl font-bold text-orange-900">{formatCurrency(currentDay?.expectedCash)}</p>
//                       </div>
//                     </div>
//                   )}

//                   <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
//                     <div className="flex flex-col items-center text-center">
//                       <div className="p-3 bg-purple-200 rounded-lg mb-3">
//                         <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-700" />
//                       </div>
//                       <span className="text-sm sm:text-base font-medium text-purple-800 mb-2">Transactions</span>
//                       <p className="text-xl sm:text-2xl font-bold text-purple-900">{currentDay?.totalTransactions || 0}</p>
//                     </div>
//                   </div>

//                   <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-red-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
//                     <div className="flex flex-col items-center text-center">
//                       <div className="p-3 bg-red-200 rounded-lg mb-3">
//                         <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-red-700" />
//                       </div>
//                       <span className="text-sm sm:text-base font-medium text-red-800 mb-2">Cash Variance</span>
//                       <p className="text-xl sm:text-2xl font-bold text-red-900">{formatCurrency(currentDay?.status === "closed" ? currentDay?.cashVariance : (currentDay?.expectedCash || 0) - (currentDay?.openingCash || 0))}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="text-center py-8 sm:py-12 lg:py-16">
//                 <div className="p-4 sm:p-6 bg-gray-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
//                   <XCircle className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-gray-400" />
//                 </div>
//                 <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">No Day Operation Active</h3>
//                 <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">Start a new day to begin tracking sales and operations</p>
//                 <button
//                   onClick={() => setShowOpenModal(true)}
//                   onKeyDown={e => {
//                     if (e.key === "Enter") {
//                       e.preventDefault();
//                       setShowOpenModal(true);
//                     }
//                   }}
//                   className="bg-gradient-to-r from-[#4682b4] to-[#6ba4d3] text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto text-base sm:text-lg font-semibold"
//                 >
//                   <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
//                   Open Day
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Recent Days */}
//       <div className="bg-white rounded-lg shadow-md">
//         <div className="p-4 sm:p-6 border-b border-gray-200">
//           <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Day Operations</h2>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                 <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Users</th>
//                 <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
//                 <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Transactions</th>
//                 <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Cash Variance</th>
//                 <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {recentDays.map(day => (
//                 <tr key={day.id} className="hover:bg-gray-50">
//                   <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
//                     <div>
//                       <div className="font-bold">{formatWeekday(day.date)}</div>
//                       <div className="text-xs text-gray-500">{formatDate(day.date)}</div>
//                     </div>
//                   </td>
//                   <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
//                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${day.status === "opened" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{day.status}</span>
//                   </td>
//                   <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
//                     <div className="flex flex-col space-y-1">
//                       {day.openedBy && (
//                         <div className="flex items-center">
//                           <span className="text-xs font-medium text-gray-600">Opened:</span>
//                           <span className="ml-1 text-xs">{day.openedBy}</span>
//                         </div>
//                       )}
//                       {day.closedBy && (
//                         <div className="flex items-center">
//                           <span className="text-xs font-medium text-gray-600">Closed:</span>
//                           <span className="ml-1 text-xs">{day.closedBy}</span>
//                         </div>
//                       )}
//                       {!day.openedBy && !day.closedBy && <span className="text-xs italic">No user data</span>}
//                     </div>
//                   </td>
//                   <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{formatCurrency(day.totalSales)}</td>
//                   <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">{day.totalTransactions}</td>
//                   <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">
//                     <span className={`${day.cashVariance === 0 ? "text-gray-900" : day.cashVariance > 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(day.cashVariance)}</span>
//                   </td>
//                   <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">{day.autoReportGenerated && <ViewReportButton date={day.date} onClick={handleViewReport} loading={reportLoading} />}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Open Day Modal */}
//       <DayOperationsModal open={showOpenModal} onOpenChange={setShowOpenModal} onSubmit={handleOpenDay} type="open" formData={convertToModalFormData("open")} onFormChange={data => handleModalFormChange("open", data)} formatCurrency={formatCurrency} />

//       {/* Close Day Modal */}
//       <DayOperationsModal open={showCloseModal} onOpenChange={setShowCloseModal} onSubmit={handleCloseDay} type="close" formData={convertToModalFormData("close")} onFormChange={data => handleModalFormChange("close", data)} formatCurrency={formatCurrency} />

//       {/* Daily Reports Modal */}
//       <DailyReports showReportModal={showReportModal} setShowReportModal={setShowReportModal} selectedReport={selectedReport} error={reportError} setError={setReportError} />
//     </div>
//   );
// };

// export default DayOperationsPage;
import { BarChart3, Calendar, CheckCircle, Clock, DollarSign, Plus, ToggleLeft, ToggleRight, TrendingUp, XCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { dayOperationsAPI } from "../api/dayOperations.api";
import { useAuth } from "../contexts/AuthContext";
import { useDayOperations } from "../contexts/DayOperationsContext";
import DayOperationsModal from "../components/DayOperationsModal/DayOperationsModal";
import DailyReports from "../components/analytics/DailyReports";
import ViewReportButton from "../components/ui/ViewReportButton";
import { useDailyReports } from "../hooks/useDailyReports";
import { CloseDayRequest, DayOperation, OpenDayRequest } from "../types/inventory";
import type { DayOperationsFormData } from "@/types/dayOperations";
import { formatCurrency, formatDate, formatDateTime, formatWeekday } from "@/utils/dayOperationsFormattings";

// Destructure API methods for cleaner usage
const { getDayOperations } = dayOperationsAPI;

const DayOperationsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    currentDay,
    loading,
    error,
    success,
    openDay: contextOpenDay,
    closeDay: contextCloseDay,
    clearError,
    clearSuccess,
    getCurrentTime, // Use the context's getCurrentTime function
    timeOverride, // Access time override state
    toggleMockTime, // Function to toggle mock time
    updateMockDate // Function to update mock date
  } = useDayOperations();

  // Local state for page-specific data
  const [recentDays, setRecentDays] = useState<DayOperation[]>([]);
  const [showTotalSales, setShowTotalSales] = useState(true);
  const [currentTime, setCurrentTime] = useState(getCurrentTime()); // Use context's getCurrentTime
  const [openDayForm, setOpenDayForm] = useState<OpenDayRequest>({ openingCash: 0, openedBy: user?.fullName || "", notes: "" });
  const [closeDayForm, setCloseDayForm] = useState<CloseDayRequest>({ closingCash: 0, closedBy: user?.fullName || "", notes: "", userId: user?.id as any });
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Daily reports hook
  const { handleViewReport, showReportModal, setShowReportModal, selectedReport, loading: reportLoading, error: reportError, setError: setReportError } = useDailyReports();

  // Real-time clock update - uses context's getCurrentTime
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000); // Update every second
    return () => clearInterval(timer);
  }, [getCurrentTime]);

  // Load recent days data (current day is handled by context)
  const loadRecentDays = async () => {
    try {
      const recentResponse = await getDayOperations(1, 10);
      console.log("🔍 DayOperationsPage: Loading recent days data:", recentResponse.dayOperations.length);
      setRecentDays(recentResponse.dayOperations);
    } catch (err) {
      console.error("❌ DayOperationsPage: Failed to load recent days:", err);
    }
  };

  useEffect(() => {
    loadRecentDays();
  }, []);

  // Keyboard event handler for Enter key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !showOpenModal && !showCloseModal && !currentDay) {
        event.preventDefault();
        setShowOpenModal(true);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [showOpenModal, showCloseModal, currentDay]);

  // Update form user fields when user changes
  useEffect(() => {
    if (user) {
      if (user.fullName) {
        setOpenDayForm(prev => ({
          ...prev,
          openedBy: user.fullName
        }));
        setCloseDayForm(prev => ({
          ...prev,
          closedBy: user.fullName
        }));
      }
      // Always keep userId in sync for per-user operations
      setOpenDayForm(prev => ({
        ...prev,
        userId: user.id as any
      }));
      setCloseDayForm(prev => ({
        ...prev,
        userId: user.id as any
      }));
    }
  }, [user]);

  const handleOpenDay = async () => {
    try {
      // Use context's openDay function which handles all state management
      await contextOpenDay({ ...openDayForm, userId: user?.id as any });
      setShowOpenModal(false);
      setOpenDayForm({ openingCash: 0, openedBy: user?.fullName || "", notes: "", userId: user?.id as any });
      // Refresh recent days to show the new day
      loadRecentDays();
    } catch (err) {
      console.error("❌ DayOperationsPage: Failed to open day:", err);
    }
  };

  const handleCloseDay = async () => {
    try {
      // Use context's closeDay function which handles all state management
      await contextCloseDay({ ...closeDayForm, userId: user?.id as any });
      setShowCloseModal(false);
      setCloseDayForm({ closingCash: 0, closedBy: user?.fullName || "", notes: "", userId: user?.id as any });
      // Refresh recent days to show the updated day
      loadRecentDays();
    } catch (err) {
      console.error("❌ DayOperationsPage: Failed to close day:", err);
    }
  };

  // Convert form data for the reusable modal component
  const convertToModalFormData = (type: "open" | "close"): DayOperationsFormData => {
    if (type === "open") {
      return {
        openingCash: openDayForm.openingCash,
        openedBy: openDayForm.openedBy,
        notes: openDayForm.notes
      };
    } else {
      return {
        closingCash: closeDayForm.closingCash,
        closedBy: closeDayForm.closedBy,
        notes: closeDayForm.notes
      };
    }
  };

  const handleModalFormChange = (type: "open" | "close", data: DayOperationsFormData) => {
    if (type === "open") {
      setOpenDayForm({
        openingCash: data.openingCash || 0,
        openedBy: data.openedBy || "",
        notes: data.notes || ""
      });
    } else {
      setCloseDayForm({
        closingCash: data.closingCash || 0,
        closedBy: data.closedBy || "",
        notes: data.notes || ""
      });
    }
  };

  // Function to handle time control (for development)
  const handleTimeControl = () => {
    if (timeOverride.enabled) {
      toggleMockTime(false);
    } else {
      // Set a specific mock date for testing
      const mockDate = new Date("2023-11-15T14:30:00");
      toggleMockTime(true, mockDate);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading day operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Development Time Control Button (only show in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
          <button onClick={handleTimeControl} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm font-medium hover:bg-yellow-600">
            {timeOverride.enabled ? "Using Mock Time - Click for Real Time" : "Using Real Time - Click for Mock Time"}
          </button>
          {timeOverride.enabled && <span className="ml-3 text-yellow-700 text-sm">Mock Time: {getCurrentTime().toLocaleString()}</span>}
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center">
          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
          <span className="text-red-700 text-sm sm:text-base flex-1">{error}</span>
          <button onClick={clearError} className="ml-2 sm:ml-auto text-red-500 hover:text-red-700 text-lg sm:text-xl">
            ×
          </button>
        </div>
      )}

      {reportError && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center">
          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
          <span className="text-red-700 text-sm sm:text-base flex-1">{reportError}</span>
          <button onClick={() => setReportError(null)} className="ml-2 sm:ml-auto text-red-500 hover:text-red-700 text-lg sm:text-xl">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
          <span className="text-green-700 text-sm sm:text-base flex-1">{success}</span>
          <button onClick={clearSuccess} className="ml-2 sm:ml-auto text-green-500 hover:text-green-700 text-lg sm:text-xl">
            ×
          </button>
        </div>
      )}

      {/* Current Day Status */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 lg:mb-12">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Current Day Status</h2>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">
                    {formatWeekday(currentTime)}, {formatDate(currentTime)}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <div className="text-xs sm:text-sm text-gray-500">Current Time</div>
                <div className="text-base sm:text-lg font-bold text-gray-900">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">{formatDate(currentTime)}</div>
                {timeOverride.enabled && <div className="text-xs text-yellow-600 mt-1">Using Mock Time</div>}
              </div>
            </div>

            {currentDay ? (
              <div className="space-y-6">
                {currentDay.status === "opened" ? (
                  <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
                    <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-green-100 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16 opacity-50"></div>
                    <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                        <div className="p-2 sm:p-3 lg:p-4 bg-green-100 rounded-xl sm:rounded-2xl shadow-md">
                          <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900 mb-1 sm:mb-2">Day is Open & Active</h3>
                          <p className="text-sm sm:text-base lg:text-lg text-green-700 mb-1">Opened at {formatDateTime(currentDay.openedAt)}</p>
                          <p className="text-xs sm:text-sm lg:text-base text-green-600">
                            Managed by <span className="font-semibold">{currentDay.openedBy}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setShowCloseModal(true)} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm sm:text-base lg:text-lg w-full sm:w-auto">
                        Close Shift
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
                    <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gray-100 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16 opacity-50"></div>
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                      <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                        <div className="p-2 sm:p-3 lg:p-4 bg-gray-100 rounded-xl sm:rounded-2xl shadow-md">
                          <XCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Day is Closed</h3>
                          <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-1">{currentDay.closedAt ? `Closed at ${formatDateTime(currentDay.closedAt)}` : "Day was closed"}</p>
                          <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                            {currentDay.closedBy && (
                              <span>
                                Managed by <span className="font-semibold">{currentDay.closedBy}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setShowOpenModal(true)} className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm sm:text-base lg:text-lg w-full sm:w-auto">
                        Open New Day
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-blue-200 rounded-lg mb-3">
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-700" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-blue-800 mb-2">Opening Cash</span>
                      <p className="text-xl sm:text-2xl font-bold text-blue-900">{formatCurrency(currentDay?.openingCash)}</p>
                    </div>
                  </div>

                  {/* Total Sales - conditionally shown based on toggle */}
                  {showTotalSales && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                      <div className="flex flex-col items-center text-center relative">
                        <button onClick={() => setShowTotalSales(false)} className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors" title="Show Expected Cash">
                          <ToggleRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <div className="p-3 bg-green-200 rounded-lg mb-3">
                          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-700" />
                        </div>
                        <span className="text-sm sm:text-base font-medium text-green-800 mb-2">Total Sales</span>
                        <p className="text-xl sm:text-2xl font-bold text-green-900">{formatCurrency(currentDay?.totalSales)}</p>
                      </div>
                    </div>
                  )}

                  {/* Expected Cash - conditionally shown based on toggle */}
                  {!showTotalSales && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                      <div className="flex flex-col items-center text-center relative">
                        <button onClick={() => setShowTotalSales(true)} className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors" title="Show Total Sales">
                          <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <div className="p-3 bg-orange-200 rounded-lg mb-3">
                          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-700" />
                        </div>
                        <span className="text-sm sm:text-base font-medium text-orange-800 mb-2">Expected Cash</span>
                        <p className="text-xl sm:text-2xl font-bold text-orange-900">{formatCurrency(currentDay?.expectedCash)}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-purple-200 rounded-lg mb-3">
                        <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-700" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-purple-800 mb-2">Transactions</span>
                      <p className="text-xl sm:text-2xl font-bold text-purple-900">{currentDay?.totalTransactions || 0}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-red-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-red-200 rounded-lg mb-3">
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-red-700" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-red-800 mb-2">Cash Variance</span>
                      <p className="text-xl sm:text-2xl font-bold text-red-900">{formatCurrency(currentDay?.status === "closed" ? currentDay?.cashVariance : (currentDay?.expectedCash || 0) - (currentDay?.openingCash || 0))}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 lg:py-16">
                <div className="p-4 sm:p-6 bg-gray-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
                  <XCircle className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-gray-400" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">No Day Operation Active</h3>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">Start a new day to begin tracking sales and operations</p>
                <button
                  onClick={() => setShowOpenModal(true)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setShowOpenModal(true);
                    }
                  }}
                  className="bg-gradient-to-r from-[#4682b4] to-[#6ba4d3] text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto text-base sm:text-lg font-semibold"
                >
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                  Open Day
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Days */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Day Operations</h2>
          {timeOverride.enabled && <div className="text-xs text-yellow-600 mt-1">Showing data filtered by mock time: {getCurrentTime().toLocaleDateString()}</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Users</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Transactions</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Cash Variance</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDays
                .filter(day => {
                  // If using mock time, filter to show only days around the mock date
                  if (timeOverride.enabled) {
                    const mockDate = getCurrentTime();
                    const dayDate = new Date(day.date);

                    // Show days within 7 days of the mock date
                    const timeDiff = Math.abs(dayDate.getTime() - mockDate.getTime());
                    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    return diffDays <= 7;
                  }
                  return true; // Show all days when using real time
                })
                .map(day => {
                  // If using mock time, adjust the dates to be relative to the mock date
                  let displayDate = new Date(day.date);

                  if (timeOverride.enabled) {
                    const mockDate = getCurrentTime();
                    const originalDate = new Date(day.date);

                    // Adjust the year, month, and day to match the mock date
                    // but keep the original time of day
                    displayDate = new Date(mockDate.getFullYear(), mockDate.getMonth(), mockDate.getDate(), originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds());

                    // For days in the past relative to mock date, subtract days
                    const timeDiff = mockDate.getTime() - displayDate.getTime();
                    const diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));

                    if (diffDays > 0) {
                      displayDate.setDate(displayDate.getDate() - diffDays);
                    }
                  }

                  return (
                    <tr key={day.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <div>
                          <div className="font-bold">{formatWeekday(displayDate)}</div>
                          <div className="text-xs text-gray-500">{formatDate(displayDate)}</div>
                          {timeOverride.enabled && <div className="text-xs text-yellow-600 mt-1">Adjusted date</div>}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${day.status === "opened" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{day.status}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        <div className="flex flex-col space-y-1">
                          {day.openedBy && (
                            <div className="flex items-center">
                              <span className="text-xs font-medium text-gray-600">Opened:</span>
                              <span className="ml-1 text-xs">{day.openedBy}</span>
                            </div>
                          )}
                          {day.closedBy && (
                            <div className="flex items-center">
                              <span className="text-xs font-medium text-gray-600">Closed:</span>
                              <span className="ml-1 text-xs">{day.closedBy}</span>
                            </div>
                          )}
                          {!day.openedBy && !day.closedBy && <span className="text-xs italic">No user data</span>}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{formatCurrency(day.totalSales)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">{day.totalTransactions}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">
                        <span className={`${day.cashVariance === 0 ? "text-gray-900" : day.cashVariance > 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(day.cashVariance)}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">{day.autoReportGenerated && <ViewReportButton date={displayDate} onClick={() => handleViewReport(displayDate)} loading={reportLoading} />}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {timeOverride.enabled &&
            recentDays.filter(day => {
              const mockDate = getCurrentTime();
              const dayDate = new Date(day.date);
              const timeDiff = Math.abs(dayDate.getTime() - mockDate.getTime());
              const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
              return diffDays <= 7;
            }).length === 0 && <div className="p-4 text-center text-gray-500">No day operations found for the selected mock time period.</div>}
        </div>
      </div>

      {/* Open Day Modal */}
      <DayOperationsModal open={showOpenModal} onOpenChange={setShowOpenModal} onSubmit={handleOpenDay} type="open" formData={convertToModalFormData("open")} onFormChange={data => handleModalFormChange("open", data)} formatCurrency={formatCurrency} />

      {/* Close Day Modal */}
      <DayOperationsModal open={showCloseModal} onOpenChange={setShowCloseModal} onSubmit={handleCloseDay} type="close" formData={convertToModalFormData("close")} onFormChange={data => handleModalFormChange("close", data)} formatCurrency={formatCurrency} />

      {/* Daily Reports Modal */}
      <DailyReports showReportModal={showReportModal} setShowReportModal={setShowReportModal} selectedReport={selectedReport} error={reportError} setError={setReportError} />
    </div>
  );
};

export default DayOperationsPage;

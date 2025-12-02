import React, { useState, useEffect } from "react";
import { Plus, X, Loader, AlertCircle } from "lucide-react";
import {
  getTickets,
  createTicket,
  type Ticket,
} from "../../services/crm/support";

const Support = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState<
    Omit<Ticket, "id" | "created_at" | "updated_at">
  >({
    task: "Bug Report",
    subject: "",
    requester_email: "",
    description: "",
    issue_category: "Software",
    severity: "Low",
  });

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      setError("Failed to fetch tickets.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTicket(formData as Ticket);
      await loadTickets(); // Refresh list
      setIsModalOpen(false); // Close modal
      // Reset form
      setFormData({
        task: "Bug Report",
        subject: "",
        requester_email: "",
        description: "",
        issue_category: "Software",
        severity: "Low",
      });
    } catch (err) {
      alert("Failed to create ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Support Tickets
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Manage and track customer support requests
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          <Plus size={20} />
          New Ticket
        </button>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm">
                <tr>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Requester</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {tickets.map((ticket, i) => (
                  <tr
                    key={ticket.id || i}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"
                  >
                    <td className="p-4">
                      <div className="font-medium text-slate-800 dark:text-white">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {ticket.task}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {ticket.issue_category}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          ticket.severity === "Critical"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : ticket.severity === "High"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {ticket.severity}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                      {ticket.requester_email}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                      {ticket.created_at
                        ? new Date(ticket.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Create New Ticket
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form
                id="ticketForm"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Task Type
                    </label>
                    <select
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={formData.task}
                      onChange={(e) =>
                        setFormData({ ...formData, task: e.target.value })
                      }
                    >
                      <option>Bug Report</option>
                      <option>Feature Request</option>
                      <option>Maintenance</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Severity
                    </label>
                    <select
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={formData.severity}
                      onChange={(e) =>
                        setFormData({ ...formData, severity: e.target.value })
                      }
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Issue Category
                  </label>
                  <select
                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={formData.issue_category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        issue_category: e.target.value,
                      })
                    }
                  >
                    <option>Software</option>
                    <option>Hardware</option>
                    <option>Network</option>
                    <option>Access/Auth</option>
                    <option>Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Brief summary of the issue"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Requester Email
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="user@example.com"
                    value={formData.requester_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requester_email: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Detailed description..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
              >
                Cancel
              </button>
              <button
                form="ticketForm"
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader className="animate-spin" size={18} />
                ) : null}
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;

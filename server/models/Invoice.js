import supabase from '../config/supabase.js';

export class Invoice {
  static async create(invoiceData) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async findAll(filters = {}) {
    let query = supabase.from('invoices').select('*', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.customer_name) {
      query = query.ilike('customer_name', `%${filters.customer_name}%`);
    }
    if (filters.startDate) {
      query = query.gte('invoice_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('invoice_date', filters.endDate);
    }

    query = query.order('invoice_date', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count };
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async getStats(filters = {}) {
    let query = supabase.from('invoices').select('status, total_amount, invoice_date');

    if (filters.startDate) {
      query = query.gte('invoice_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('invoice_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      total: data.length,
      totalAmount: data.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0),
      paid: data.filter(inv => inv.status === 'paid').length,
      pending: data.filter(inv => inv.status === 'pending').length,
      overdue: data.filter(inv => inv.status === 'overdue').length,
      cancelled: data.filter(inv => inv.status === 'cancelled').length,
      paidAmount: data
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0),
      pendingAmount: data
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0),
    };

    return stats;
  }
}

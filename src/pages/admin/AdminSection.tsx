type AdminSectionProps = {
  title: string;
  description?: string;
};

const AdminSection = ({ title, description }: AdminSectionProps) => {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 shadow-lg">
      <p className="text-xs font-black text-teal-300 uppercase tracking-wide mb-2">Admin</p>
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">{title}</h1>
      <p className="text-sm text-gray-300">
        {description ?? "This section is ready. Add your features here."}
      </p>
    </div>
  );
};

export default AdminSection;

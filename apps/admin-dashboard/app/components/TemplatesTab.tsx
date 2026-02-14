import TemplateForm from "../islands/TemplateForm";
import TemplateList from "../islands/TemplateList";

export const TemplatesTab = () => {
  return (
    <div className="space-y-6">
      <TemplateForm />
      <TemplateList />
    </div>
  );
};

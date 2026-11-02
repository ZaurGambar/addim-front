import styled from "styled-components";
import { card } from "@/styles/common/mixins";
import { useFormik } from "formik";
import * as yup from "yup";
import { toast } from "react-toastify";
import Button from "@/components/common/Button";
import InputField from "@/components/common/InputField";
import Dropdown from "@/components/common/Dropdown";

const schema = yup.object({
  point: yup.string().required("Nöqtə seçin"),
  zebra_m: yup.number().typeError("Rəqəm yazın").min(0).max(2000).nullable(),
  ped_under: yup.number().typeError("Rəqəm yazın").min(0).nullable(),
  ped_over: yup.number().typeError("Rəqəm yazın").min(0).nullable(),
  note: yup.string().max(1000, "Ən çox 1000 simvol"),
});

// Netlify Forms: "field-check" forması index.html-də gizli şəkildə elan olunub
const FieldCheckForm = ({ points }) => {
  const formik = useFormik({
    initialValues: { point: points[0]?.value || "", works: "", lift: "", zebra_m: "", signal: "", ped_under: "", ped_over: "", note: "", photo: null },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const fd = new FormData();
      fd.append("form-name", "field-check");
      Object.entries(values).forEach(([k, v]) => {
        if (v !== null && v !== "") fd.append(k, v);
      });
      try {
        const res = await fetch("/", { method: "POST", body: fd });
        if (!res.ok) throw new Error(String(res.status));
        toast.success("Yoxlama göndərildi");
        resetForm({ values: { ...formik.initialValues, point: values.point } });
      } catch {
        toast.error("Göndərilmədi. İnterneti yoxlayıb yenidən cəhd edin.");
      } finally {
        setSubmitting(false);
      }
    },
  });
  const f = formik;
  const err = (k) => f.touched[k] && f.errors[k];
  const yesNo = (opts) => [{ value: "", label: "–" }, ...opts.map((o) => ({ value: o, label: o }))];

  return (
    <Form onSubmit={f.handleSubmit} noValidate>
      <div className="full">
        <Dropdown id="fc-point" label="Nöqtə" value={f.values.point} onChange={(v) => f.setFieldValue("point", v)} options={points} />
      </div>
      <Dropdown id="fc-works" label="Yeraltı keçid işləyir?" value={f.values.works} onChange={(v) => f.setFieldValue("works", v)} options={yesNo(["bəli", "xeyr", "bağlıdır"])} />
      <Dropdown id="fc-lift" label="Lift və ya pandus?" value={f.values.lift} onChange={(v) => f.setFieldValue("lift", v)} options={yesNo(["lift", "pandus", "yoxdur"])} />
      <InputField id="fc-zebra" name="zebra_m" type="number" inputMode="numeric" label="Ən yaxın zebra, m" value={f.values.zebra_m} onChange={f.handleChange} onBlur={f.handleBlur} error={err("zebra_m")} />
      <Dropdown id="fc-signal" label="Svetofor var?" value={f.values.signal} onChange={(v) => f.setFieldValue("signal", v)} options={yesNo(["bəli", "xeyr"])} />
      <InputField id="fc-under" name="ped_under" type="number" inputMode="numeric" label="15 dəq. yeraltından keçən" value={f.values.ped_under} onChange={f.handleChange} onBlur={f.handleBlur} error={err("ped_under")} />
      <InputField id="fc-over" name="ped_over" type="number" inputMode="numeric" label="15 dəq. yolun üstündən keçən" value={f.values.ped_over} onChange={f.handleChange} onBlur={f.handleBlur} error={err("ped_over")} />
      <div className="full">
        <InputField id="fc-photo" name="photo" type="file" accept="image/*" capture="environment" label="Şəkil" onChange={(e) => f.setFieldValue("photo", e.currentTarget.files[0] || null)} />
      </div>
      <div className="full">
        <InputField as="textarea" id="fc-note" name="note" rows={3} label="Qeyd" placeholder="Məs.: pilləkən sürüşkəndir, işıqlandırma zəifdir" value={f.values.note} onChange={f.handleChange} onBlur={f.handleBlur} error={err("note")} />
      </div>
      <div className="full">
        <Button type="submit" disabled={f.isSubmitting}>
          {f.isSubmitting ? "Göndərilir…" : "Yoxlamanı göndər"}
        </Button>
      </div>
    </Form>
  );
};

export default FieldCheckForm;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 14px;
  ${card}

  .full {
    grid-column: 1 / -1;
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

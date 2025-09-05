import { useEffect, useMemo, useState } from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import CatalogService, { Option } from '@/services/catalog.service';
import api from '@/services/http';
import { useNotify } from '@/services/notify';
import { formatNumber, unformatNumber } from '@/utils/formatting';

interface Person {
  id: number;
  identification: string;
  firstName: string;
  lastName: string;
  name?: string;
}

export const useDrivers = () => {
  const { success, warning, error } = useNotify();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<number>(0);

  // Person search state
  const [idQuery, setIdQuery] = useState('');
  const [idOptions, setIdOptions] = useState<Person[]>([]);
  const [idLoading, setIdLoading] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  const [nameOptions, setNameOptions] = useState<Person[]>([]);
  const [nameLoading, setNameLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Person | null>(null);

  const handleDriverSelection = (person: Person | null) => {
    setSelectedDriver(person);
    if (person) {
      setSelectedDriverId(person.id);
      setIdQuery(formatNumber(person.identification));
      setNameQuery(`${person.firstName} ${person.lastName}`.trim());
    } else {
      setSelectedDriverId(0);
    }
  };

  const resetDriverSearch = () => {
    setIdQuery('');
    setNameQuery('');
    setSelectedDriver(null);
    setSelectedDriverId(0);
  };

  // Debounced search for person by ID
  useEffect(() => {
    const q = unformatNumber(idQuery);
    if (!q) {
      setIdOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setIdLoading(true);
      try {
        const res = await api.get<Person[]>('/drivers', { params: { identification: q } });
        const data = (Array.isArray(res.data) ? res.data : []).map(p => ({ ...p, name: `${p.firstName} ${p.lastName}`.trim() }));
        setIdOptions(data);
      } catch {
        setIdOptions([]);
      } finally {
        setIdLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [idQuery]);

  // Debounced search for person by name
  useEffect(() => {
    const q = nameQuery.trim();
    if (!q) {
      setNameOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setNameLoading(true);
      try {
        const res = await api.get<Person[]>('/drivers', { params: { name: q } });
        const data = (Array.isArray(res.data) ? res.data : []).map(p => ({ ...p, name: `${p.firstName} ${p.lastName}`.trim() }));
        setNameOptions(data);
      } catch {
        setNameOptions([]);
      } finally {
        setNameLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [nameQuery]);

  // Form fields
  const [identification, setIdentification] = useState('');
  const [issuedIn, setIssuedIn] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [license, setLicense] = useState('');
  const [category, setCategory] = useState('');
  const [expiresOn, setExpiresOn] = useState<Dayjs | null>(null);
  const [bloodType, setBloodType] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoFilename, setPhotoFilename] = useState('');
  const [epsId, setEpsId] = useState<number>(0);
  const [arlId, setArlId] = useState<number>(0);

  const populateDriverForm = (driver: any) => {
    if (!driver) return;
    setIdentification(formatNumber(driver.identification));
    setIssuedIn(String(driver?.issuedIn || ''));
    setFirstName(String(driver?.firstName || ''));
    setLastName(String(driver?.lastName || ''));
    setPhone(String(driver?.phone || ''));
    setAddress(String(driver?.address || ''));
    setLicense(formatNumber(String(driver?.license || '')));
    setCategory(String(driver?.category || ''));
    setBloodType(String(driver?.bloodType || ''));
    try {
      const dateStr = String(driver?.expiresOn || '').slice(0, 10);
      setExpiresOn(dateStr ? dayjs(dateStr) : null);
    } catch {
      setExpiresOn(null);
    }
    setPhoto(String(driver?.photo || ''));
    setEpsId(Number(driver?.epsId || 0));
    setArlId(Number(driver?.arlId || 0));
        setSelectedDriverId(Number(driver?.id || 0));
  };

  // Catalog data
  const [epsList, setEpsList] = useState<Option[]>([]);
  const [arlList, setArlList] = useState<Option[]>([]);

  const disabledAll = loading || submitting;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const catalogs = CatalogService.getCatalogsFromStorage();
        if (!catalogs) {
          warning('Catálogos no disponibles. Inicia sesión para precargar los catálogos.');
        } else {
          setEpsList(catalogs.eps || []);
          setArlList(catalogs.arls || []);
        }
      } catch (e: any) {
        console.error('Error loading initial data', e);
        const msg = e?.response?.data?.message || 'Error cargando datos';
        error(Array.isArray(msg) ? msg.join('\n') : String(msg));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [warning, error]);

  const canSubmit = useMemo(() => {
    return (
      unformatNumber(identification).trim().length > 0 &&
      issuedIn.trim().length > 0 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      phone.trim().length > 0 &&
      license.trim().length > 0 &&
      category.trim().length > 0 &&
      !!expiresOn &&
      bloodType.trim().length > 0 &&
      photo.trim().length > 0 &&
      epsId > 0 &&
      arlId > 0
    );
  }, [identification, issuedIn, firstName, lastName, phone, license, category, expiresOn, bloodType, photo, epsId, arlId]);

  const resetForm = () => {
    setIdentification('');
    setIssuedIn('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setAddress('');
    setLicense('');
    setCategory('');
    setExpiresOn(null);
    setBloodType('');
    setPhoto('');
    setPhotoFilename('');
        setEpsId(0);
    setArlId(0);
    setSelectedDriverId(0);
    resetDriverSearch();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: any = {
        identification: unformatNumber(identification),
        issuedIn: issuedIn.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        license: unformatNumber(license),
        category: category.trim(),
        expiresOn: expiresOn ? expiresOn.format('YYYY-MM-DD') : '',
        bloodType: bloodType.trim(),
        photo: photo.trim(),
        epsId,
        arlId,
      };
      if (address.trim()) payload.address = address.trim();
      let res;
      if (selectedDriverId > 0) {
        res = await api.put(`/drivers/${selectedDriverId}`, payload);
        success('Conductor actualizado con éxito (ID ' + (res.data?.id ?? selectedDriverId) + ').');
      } else {
        res = await api.post('/drivers', payload);
        success('Conductor creado con éxito (ID ' + res.data?.id + ').');
        resetForm();
      }
    } catch (e: any) {
      console.error('Error creating driver', e);
      const msg = e?.response?.data?.message || 'Error creando conductor';
      error(Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (selectedDriver) {
      populateDriverForm(selectedDriver);
    } else {
      const currentId = identification;
      resetForm();
      setIdentification(currentId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDriver]);

  const createEps = async (name: string) => {
    const created = await CatalogService.createEps(name);
    setEpsList(prev => [...prev, created]);
    return created;
  };

  const createArl = async (name: string) => {
    const created = await CatalogService.createArl(name);
    setArlList(prev => [...prev, created]);
    return created;
  };

  return {
    loading,
    submitting,
    selectedDriverId,
    identification,
    issuedIn,
    firstName,
    lastName,
    phone,
    address,
    license,
    category,
    expiresOn,
    bloodType,
    photo,
    photoFilename,
    epsId,
    arlId,
    epsList,
    arlList,
    disabledAll,
    canSubmit,
    idQuery,
    idOptions,
    idLoading,
    nameQuery,
    nameOptions,
    nameLoading,
    setIdentification,
    setIssuedIn,
    setFirstName,
    setLastName,
    setPhone,
    setAddress,
    setLicense: (val: string) => setLicense(formatNumber(val)),
    setCategory,
    setExpiresOn,
    setBloodType,
    setPhoto,
    setPhotoFilename,
    setEpsId,
    setArlId,
    onSubmit,
    resetForm,
    handleDriverSelection,
    createEps,
    createArl,
    setIdQuery,
    setNameQuery
  };
};

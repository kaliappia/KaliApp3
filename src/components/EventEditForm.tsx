import { useState } from 'react';
import { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvents } from '@/contexts/EventContext';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import AddressAutocomplete, { AddressData } from '@/components/AddressAutocomplete';

interface EventEditFormProps {
  event: Event;
  onClose: () => void;
}

export default function EventEditForm({ event, onClose }: EventEditFormProps) {
  const { t } = useTranslation();
  const { updateEvent } = useEvents();
  const [addressData, setAddressData] = useState<AddressData | null>(
    event.formattedAddress ? {
      placeId: event.placeId || '',
      placeName: event.placeName,
      formattedAddress: event.formattedAddress,
      lat: event.lat || 0,
      lng: event.lng || 0,
      city: event.city,
      countryCode: event.countryCode
    } : null
  );
  const [isAddressValid, setIsAddressValid] = useState(!!event.formattedAddress);
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    date: format(event.startDate, 'yyyy-MM-dd'),
    startTime: format(event.startDate, 'HH:mm'),
    endTime: format(event.endDate, 'HH:mm'),
    visibility: event.visibility,
    category: event.category
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addressData) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const [year, month, day] = formData.date.split('-').map(Number);
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      
      const startDate = new Date(year, month - 1, day, startHour, startMinute);
      const endDate = new Date(year, month - 1, day, endHour, endMinute);
      
      await updateEvent(event.id, {
        title: formData.title,
        description: formData.description,
        startDate,
        endDate,
        location: addressData.formattedAddress,
        placeId: addressData.placeId,
        placeName: addressData.placeName,
        formattedAddress: addressData.formattedAddress,
        lat: addressData.lat,
        lng: addressData.lng,
        city: addressData.city,
        countryCode: addressData.countryCode,
        visibility: formData.visibility as 'private' | 'public' | 'friends',
        category: formData.category
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t('eventForm.title')}</Label>
        <Input
          id="title"
          placeholder={t('eventForm.titlePlaceholder')}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('eventForm.description')}</Label>
        <Textarea
          id="description"
          placeholder={t('eventForm.descriptionPlaceholder')}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">{t('eventForm.date')}</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">{t('eventForm.category')}</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Music">{t('categories.music')}</SelectItem>
              <SelectItem value="Sports">{t('categories.sports')}</SelectItem>
              <SelectItem value="Technology">{t('categories.technology')}</SelectItem>
              <SelectItem value="Food">{t('categories.food')}</SelectItem>
              <SelectItem value="Work">{t('categories.work')}</SelectItem>
              <SelectItem value="Other">{t('categories.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">{t('eventForm.startTime')}</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">{t('eventForm.endTime')}</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />
        </div>
      </div>

      <AddressAutocomplete
        value={addressData}
        onChange={setAddressData}
        onValidationChange={setIsAddressValid}
        required
      />

      <div className="space-y-2">
        <Label htmlFor="visibility">{t('eventForm.visibility')}</Label>
        <Select value={formData.visibility} onValueChange={(v) => setFormData({ ...formData, visibility: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">{t('eventForm.private')}</SelectItem>
            <SelectItem value="friends">{t('eventForm.friends')}</SelectItem>
            <SelectItem value="public">{t('eventForm.public')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
          {t('eventForm.cancel')}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting || !isAddressValid}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
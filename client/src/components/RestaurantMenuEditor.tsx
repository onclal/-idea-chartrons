import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createEmptyMenu,
  normalizeMenu,
  type ActeurLocal,
  type CommerceMenuItem,
  type CommerceMenuSection,
} from '@idea-chartrons/shared';
import { Button, Input, Textarea } from './ui';

interface RestaurantMenuEditorProps {
  acteur: ActeurLocal;
  saving?: boolean;
  onSave: (menu: CommerceMenuSection[]) => void;
}

function newItem(): CommerceMenuItem {
  return { id: `plat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, nom: '', description: '', prix: 0 };
}

function newSection(): CommerceMenuSection {
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    titre: '',
    items: [newItem()],
  };
}

export function RestaurantMenuEditor({ acteur, saving, onSave }: RestaurantMenuEditorProps) {
  const { t } = useTranslation();
  const [sections, setSections] = useState<CommerceMenuSection[]>(() =>
    normalizeMenu(acteur.menu).length > 0 ? normalizeMenu(acteur.menu) : createEmptyMenu(),
  );

  useEffect(() => {
    const next = normalizeMenu(acteur.menu);
    setSections(next.length > 0 ? next : createEmptyMenu());
  }, [acteur.id, acteur.updatedAt]);

  const updateSection = (sectionId: string, patch: Partial<CommerceMenuSection>) => {
    setSections((current) => current.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)));
  };

  const updateItem = (sectionId: string, itemId: string, patch: Partial<CommerceMenuItem>) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            }
          : section,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-chartrons-green-dark">{t('proSpace.menu.title')}</h3>
        <p className="text-xs text-chartrons-warm-gray mt-1 leading-relaxed">{t('proSpace.menu.subtitle')}</p>
      </div>

      {sections.map((section) => (
        <div key={section.id} className="rounded-xl border border-chartrons-beige p-3 space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label={t('proSpace.menu.section')}
                value={section.titre}
                onChange={(event) => updateSection(section.id, { titre: event.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="border border-chartrons-beige"
              onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}
            >
              {t('proSpace.menu.removeSection')}
            </Button>
          </div>

          {section.items.map((item) => (
            <div key={item.id} className="rounded-lg bg-chartrons-beige/40 p-2.5 space-y-2">
              <Input
                label={t('proSpace.menu.itemName')}
                value={item.nom}
                onChange={(event) => updateItem(section.id, item.id, { nom: event.target.value })}
              />
              <Textarea
                label={t('proSpace.menu.itemDescription')}
                rows={2}
                value={item.description}
                onChange={(event) => updateItem(section.id, item.id, { description: event.target.value })}
              />
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    label={t('proSpace.menu.itemPrice')}
                    value={String(item.prix)}
                    onChange={(event) => updateItem(section.id, item.id, { prix: Number(event.target.value) || 0 })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="border border-chartrons-beige"
                  onClick={() =>
                    setSections((current) =>
                      current.map((entry) =>
                        entry.id === section.id
                          ? { ...entry, items: entry.items.filter((plat) => plat.id !== item.id) }
                          : entry,
                      ),
                    )
                  }
                >
                  {t('proSpace.menu.removeItem')}
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() =>
              setSections((current) =>
                current.map((entry) => (entry.id === section.id ? { ...entry, items: [...entry.items, newItem()] } : entry)),
              )
            }
          >
            {t('proSpace.menu.addItem')}
          </Button>
        </div>
      ))}

      <Button type="button" variant="secondary" className="w-full" onClick={() => setSections((current) => [...current, newSection()])}>
        {t('proSpace.menu.addSection')}
      </Button>
      <Button type="button" variant="bordeaux" className="w-full" disabled={saving} onClick={() => onSave(sections)}>
        {saving ? t('common.loading') : t('proSpace.menu.save')}
      </Button>
    </div>
  );
}

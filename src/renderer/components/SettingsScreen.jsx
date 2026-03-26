import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Globe2, Palette, PlugZap, RefreshCcw, Pencil, Trash2, Plus } from 'lucide-react';
import { SUPPORTED_THEMES, useWorkspace } from '@context/WorkspaceContext';
import { getThemeOptions, languageOptions } from '@utils/i18n';
import { getProviderApiTypeLabel } from '@lib/providerApi';
import { ProviderModal } from './ProviderModal';
import { ProxySettingsTab } from './ProxySettingsTab';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Switch } from '@components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

export function SettingsScreen() {
  const {
    aiProviders,
    updateProvider,
    removeProvider,
    fetchProviderModels,
    setIsSettingsOpen,
    theme,
    setTheme,
    language,
    setLanguage,
    proxyPort,
    setProxyPort,
    proxyAutoStart,
    setProxyAutoStart,
    proxyStrategy,
    setProxyStrategy,
    t,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState('geral');
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [expandedModels, setExpandedModels] = useState({});
  const themeOptions = getThemeOptions(t).filter((option) => SUPPORTED_THEMES.includes(option.value));

  const handleFetchModels = async (provider) => {
    if (!provider.baseUrl || !provider.apiKey) return;

    setIsFetchingModels(true);
    try {
      await fetchProviderModels(provider.id);
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const toggleModelsExpand = (providerId) => {
    setExpandedModels((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  const getDisplayedModels = (models, providerId) => {
    if (!models) return [];
    const modelList = models.split(',').filter((item) => item.trim());
    return expandedModels[providerId] || modelList.length <= 6 ? modelList : modelList.slice(0, 6);
  };

  return (
    <div className="panel-grid relative flex h-full flex-1 flex-col overflow-hidden px-6 pb-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,159,57,0.14),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_22%)]" />
      <div className="relative flex h-full flex-col pt-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-body)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--text-tertiary)]">Configuration deck</p>
              <h1 className="font-display mt-2 text-4xl tracking-[-0.04em] text-[color:var(--text-primary)]">{t('settings.title')}</h1>
            </div>
          </div>
          <div className="rounded-[12px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">
            {aiProviders.length} providers
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="geral">{t('settings.general')}</TabsTrigger>
            <TabsTrigger value="provedores">{t('settings.providers')}</TabsTrigger>
            <TabsTrigger value="proxy">Antigravity Proxy</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"
            >
              <Card className="panel-edge">
                <CardHeader>
                  <CardTitle>Atmosfera da aplicação</CardTitle>
                  <CardDescription>
                    Ajustes globais que mudam como a interface se apresenta e como o conteúdo é localizado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-[24px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] text-[color:var(--accent)]">
                        <Globe2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-[color:var(--text-primary)]">{t('settings.languageTitle')}</p>
                        <p className="text-[0.85rem] text-[color:var(--text-secondary)]">{t('settings.languageDescription')}</p>
                      </div>
                    </div>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-[24px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] text-[color:var(--accent)]">
                        <Palette className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-[color:var(--text-primary)]">{t('settings.themeTitle')}</p>
                        <p className="text-[0.85rem] text-[color:var(--text-secondary)]">{t('settings.themeDescription')}</p>
                      </div>
                    </div>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tema" />
                      </SelectTrigger>
                      <SelectContent>
                        {themeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="panel-edge">
                <CardHeader>
                  <CardTitle>Operator notes</CardTitle>
                  <CardDescription>
                    A nova interface assume o app como uma estação de trabalho: módulos persistentes, alto contraste e foco em operação simultânea.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {[
                    ['Shell', 'Navegação, título e barras auxiliares vivem em superfícies translúcidas.'],
                    ['Workspace', 'A área principal ganha mais contraste para sessões paralelas e inspeção.'],
                    ['Providers', 'Configuração migra para controles consistentes em Radix e camada shadcn-style.'],
                    ['Motion', 'Transições curtas e intencionais em vez de microinterações genéricas.'],
                  ].map(([title, description]) => (
                    <div key={title} className="rounded-[22px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--text-tertiary)]">{title}</p>
                      <p className="mt-3 text-[0.85rem] leading-6 text-[color:var(--text-secondary)]">{description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="provedores" className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card className="panel-edge">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>{t('settings.providersTitle')}</CardTitle>
                    <CardDescription>{t('settings.providersDescription')}</CardDescription>
                  </div>
                  <Button onClick={() => setIsProviderModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t('settings.addProvider')}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiProviders.length === 0 && (
                    <div className="rounded-[28px] border border-dashed border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-10 text-center">
                      <p className="font-display text-2xl text-[color:var(--text-primary)]">{t('settings.noProvidersTitle')}</p>
                      <p className="mx-auto mt-3 max-w-xl text-[0.85rem] leading-6 text-[color:var(--text-secondary)]">
                        {t('settings.noProvidersDescription')}
                      </p>
                      <Button className="mt-6" onClick={() => setIsProviderModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                        {t('settings.addFirstProvider')}
                      </Button>
                    </div>
                  )}

                  {aiProviders.map((provider) => {
                    const modelList = provider.models ? provider.models.split(',').filter((item) => item.trim()) : [];
                    const displayedModels = getDisplayedModels(provider.models, provider.id);
                    const remainingModels = Math.max(modelList.length - displayedModels.length, 0);

                    return (
                      <div key={provider.id} className="rounded-[28px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-5 shadow-sm">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] font-display text-xl font-semibold text-[color:var(--accent)]">
                              {(provider.name || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-display text-2xl tracking-[-0.03em] text-[color:var(--text-primary)]">
                                  {provider.name || t('settings.noName')}
                                </h3>
                                <span className="rounded-full border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                                  {getProviderApiTypeLabel(provider.apiType, language)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateProvider(provider.id, { enabled: provider.enabled === false })}
                                  className="flex items-center gap-2 rounded-[12px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-3 py-1.5 shadow-sm cursor-pointer transition-colors hover:border-[color:var(--text-tertiary)] hover:bg-[color:var(--bg-body)]"
                                >
                                  <Switch
                                    checked={provider.enabled !== false}
                                    onCheckedChange={(checked) => updateProvider(provider.id, { enabled: checked })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                                    {provider.enabled !== false ? t('settings.active') : t('settings.inactive')}
                                  </span>
                                </button>
                              </div>
                              <p className="mt-2 truncate text-[0.85rem] text-[color:var(--text-secondary)]">{provider.baseUrl || t('settings.noUrl')}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingProvider(provider); setIsProviderModalOpen(true); }} className="hover:text-[color:var(--primary-color)]">
                              <Pencil className="h-3.5 w-3.5" />
                              {t('settings.editProvider')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeProvider(provider.id)} className="text-[color:var(--danger-color)] hover:bg-[color:var(--danger-color)]/10 hover:text-[color:var(--danger-color)]">
                              <Trash2 className="h-3.5 w-3.5" />
                              {t('settings.removeProvider')}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleFetchModels(provider)} disabled={isFetchingModels}>
                              <RefreshCcw className={`h-3.5 w-3.5 ${isFetchingModels ? 'animate-spin' : ''}`} />
                              {t('settings.refreshModels')}
                            </Button>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {displayedModels.length > 0 ? (
                            displayedModels.map((model) => (
                              <span
                                key={model}
                                className="rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-3 py-1.5 text-[0.75rem] font-medium text-[color:var(--text-secondary)] shadow-sm"
                              >
                                {model.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-[0.85rem] italic text-[color:var(--text-tertiary)]">{t('settings.noModelsConfigured')}</span>
                          )}
                        </div>

                        {remainingModels > 0 && (
                          <button
                            onClick={() => toggleModelsExpand(provider.id)}
                            className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]"
                          >
                            {expandedModels[provider.id] ? t('settings.showLess') : t('settings.showMore', { count: remainingModels })}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="proxy" className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            <ProxySettingsTab
              proxyPort={proxyPort}
              onProxyPortChange={setProxyPort}
              proxyAutoStart={proxyAutoStart}
              onProxyAutoStartChange={setProxyAutoStart}
              proxyStrategy={proxyStrategy}
              onProxyStrategyChange={setProxyStrategy}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ProviderModal
        isOpen={isProviderModalOpen}
        onClose={() => {
          setEditingProvider(null);
          setIsProviderModalOpen(false);
        }}
        editingProvider={editingProvider}
      />
    </div>
  );
}

#!/usr/bin/env python3
import re

def remove_status_from_simplified_purchase_management():
    """Remove todas as referências de status de SimplifiedPurchaseManagement.tsx"""
    with open('src/components/Purchases/SimplifiedPurchaseManagement.tsx', 'r') as f:
        content = f.read()
    
    # Remover estados relacionados a status
    content = re.sub(r'const \[filterStatus.*?\].*?;', '', content)
    content = re.sub(r'const \[showStatusModal.*?\].*?;', '', content)
    content = re.sub(r'const \[statusModalData.*?\].*?;', '', content)
    
    # Remover a função getStatusBadge completa
    content = re.sub(r'const getStatusBadge = \(.*?\) => \{[\s\S]*?\n  \};', '', content)
    
    # Remover handleStatusClick
    content = re.sub(r'const handleStatusClick = .*?\{[\s\S]*?\n  \};', '', content)
    
    # Remover handleQuickStatusUpdate
    content = re.sub(r'const handleQuickStatusUpdate = async.*?\{[\s\S]*?\n  \};', '', content)
    
    # Remover filtro de status das compras
    content = re.sub(r'const matchesStatus = filterStatus.*?;', '', content)
    content = re.sub(r'matchesSearch && matchesStatus', 'matchesSearch', content)
    
    # Remover status das métricas
    content = re.sub(r"active: purchases\.filter\(p => p\.status === 'CONFINED'\)\.length,", 
                    "active: purchases.filter(p => p.currentQuantity > 0).length,", content)
    
    # Remover Select de status dos filtros
    content = re.sub(r'<Select value=\{filterStatus\}[\s\S]*?</Select>', '', content)
    
    # Remover prop filterStatus da EnhancedPurchaseTable
    content = re.sub(r'filterStatus=\{filterStatus\}', '', content)
    
    # Remover onStatusChange da EnhancedPurchaseTable
    content = re.sub(r'onStatusChange=\{[\s\S]*?\}\}', '', content)
    
    # Remover Modal de Status
    content = re.sub(r'\{/\* Modal de Mudança de Status \*/\}[\s\S]*?</StatusChangeModal>\s*\)\}', '', content)
    
    # Remover importação do StatusChangeModal
    content = re.sub(r"import.*?StatusChangeModal.*?;\n", '', content)
    
    # Remover updateStatus do hook
    content = re.sub(r'updateStatus,', '', content)
    
    with open('src/components/Purchases/SimplifiedPurchaseManagement.tsx', 'w') as f:
        f.write(content)
    
    print("✅ Status removido de SimplifiedPurchaseManagement.tsx")

def remove_status_from_enhanced_table():
    """Remove status de EnhancedPurchaseTable.tsx"""
    with open('src/components/Purchases/EnhancedPurchaseTable.tsx', 'r') as f:
        content = f.read()
    
    # Remover props de status
    content = re.sub(r'filterStatus\?: string;', '', content)
    content = re.sub(r'onStatusChange\?: \(purchase: any\) => void;', '', content)
    content = re.sub(r'filterStatus = \'all\',', '', content)
    content = re.sub(r'onStatusChange', '', content)
    
    # Remover filtro de status
    content = re.sub(r'const matchesStatus.*?;', '', content)
    content = re.sub(r'matchesSearch && matchesStatus', 'matchesSearch', content)
    content = re.sub(r', filterStatus\]', ']', content)
    
    # Remover função getStatusBadge
    content = re.sub(r'// Renderizar status[\s\S]*?const getStatusBadge = .*?\{[\s\S]*?\n  \};', '', content)
    
    # Remover coluna Status da tabela
    content = re.sub(r'<TableHead className="text-center">Status</TableHead>', '', content)
    
    # Remover célula de status
    content = re.sub(r'<TableCell className="text-center">[\s\S]*?getStatusBadge\(purchase\.status.*?\)[\s\S]*?</TableCell>', '', content)
    
    # Ajustar colspan
    content = re.sub(r'colSpan=\{9\}', 'colSpan={8}', content)
    
    with open('src/components/Purchases/EnhancedPurchaseTable.tsx', 'w') as f:
        f.write(content)
    
    print("✅ Status removido de EnhancedPurchaseTable.tsx")

def remove_status_from_details_modal():
    """Remove status de PurchaseDetailsModal.tsx"""
    with open('src/components/Purchases/PurchaseDetailsModal.tsx', 'r') as f:
        content = f.read()
    
    # Remover função getStatusBadge
    content = re.sub(r'const getStatusBadge = \(status: string\) => \{[\s\S]*?\n  \};', '', content)
    
    # Remover exibição do status badge
    content = re.sub(r'\{getStatusBadge\(data\.status\)\}', '', content)
    
    # Remover verificações de status
    content = re.sub(r'\{data\.status === \'ACTIVE\' && \([\s\S]*?\)\}', '', content)
    
    with open('src/components/Purchases/PurchaseDetailsModal.tsx', 'w') as f:
        f.write(content)
    
    print("✅ Status removido de PurchaseDetailsModal.tsx")

def remove_status_from_simplified_details():
    """Remove status de SimplifiedPurchaseDetails.tsx"""
    with open('src/components/Purchases/SimplifiedPurchaseDetails.tsx', 'r') as f:
        content = f.read()
    
    # Remover função getStatusBadge
    content = re.sub(r'const getStatusBadge = \(status: string\) => \{[\s\S]*?\n  \};', '', content)
    
    # Remover exibição do status badge
    content = re.sub(r'\{getStatusBadge\(data\.status\)\}', '', content)
    
    with open('src/components/Purchases/SimplifiedPurchaseDetails.tsx', 'w') as f:
        f.write(content)
    
    print("✅ Status removido de SimplifiedPurchaseDetails.tsx")

if __name__ == '__main__':
    remove_status_from_simplified_purchase_management()
    remove_status_from_enhanced_table()
    remove_status_from_details_modal()
    remove_status_from_simplified_details()
    print("\n✅ Todas as referências de status foram removidas das páginas de compras!")